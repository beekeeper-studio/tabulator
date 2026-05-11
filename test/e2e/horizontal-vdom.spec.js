// @ts-check
import { test, expect } from "@playwright/test";
import { join } from "path";

// Repro for the cadence mismatch between the column header and the body
// when `renderHorizontal: "virtual"` is enabled (related to
// olifolkerd/tabulator#3551).
//
// Root cause:
//
//   The body uses padding-based virtualization
//   (src/js/core/rendering/renderers/VirtualDomHorizontal.js): only the
//   currently-visible columns are rendered; the off-screen columns are
//   reserved as `paddingLeft` / `paddingRight` on the body's tableElement.
//   The header is *not* virtualized – every column is rendered into
//   `headersElement`. Header / body sync is one-directional: the body's
//   scroll event sets `contentsElement.scrollLeft = body.scrollLeft`
//   (ColumnManager.js:131-137).
//
//   When scrolling LEFT, `scroll(diff)` calls `addColLeft()`. After the
//   newly-revealed column is appended, `fitDataColActualWidthCheck()`
//   may resize that column. If it does, `addColLeft` does this
//   (VirtualDomHorizontal.js:413-418):
//
//       let diff = this.fitDataColActualWidthCheck(column);
//       if (diff) {
//           this.scrollLeft = this.elementVertical.scrollLeft =
//               this.elementVertical.scrollLeft + diff;
//           this.vDomPadRight -= diff;
//       }
//
//   The body's scrollLeft is bumped by `diff` synchronously, but the
//   header's `contentsElement.scrollLeft` is NOT updated in the same
//   call. The header is only re-synced later, when the body's queued
//   scroll event fires. During a continuous left-scroll – or any
//   fast scroll where addColLeft fires repeatedly inside the same
//   event loop turn – the header lags the body by the cumulative
//   `diff`, which the user perceives as "headers move at a different
//   cadence to the rest of the table".
//
// The test below scrolls the body to its right edge to populate columns
// (so they have valid widths), then scrolls leftward in small steps,
// capturing body.scrollLeft and header.scrollLeft after each
// synchronous scroll handler. With the bug present, body.scrollLeft
// runs ahead of header.scrollLeft each time addColLeft processes a
// column whose fitData width differs from its initial width.

test.describe("Horizontal vDOM scroll sync", () => {
	test.beforeEach(async ({ page }) => {
		const htmlPath = join(__dirname, "horizontal-vdom.html");
		await page.goto(`file://${htmlPath}`);
		await page.waitForSelector(".tabulator");
		await page.waitForTimeout(300);
	});

	test("column headers stay aligned with body cells when scrolling left through fitData-resized columns", async ({ page }) => {
		const drift = await page.evaluate(async () => {
			const tableEl = document.querySelector("#test-table");
			const body = tableEl.querySelector(".tabulator-tableholder");

			// Push the body to its rightmost scroll position so addColRight
			// has populated the right end of the column set.
			body.scrollLeft = body.scrollWidth - body.clientWidth;
			body.dispatchEvent(new Event("scroll"));
			await new Promise((r) => requestAnimationFrame(() => r(null)));

			function visibleAlignmentMismatches() {
				const out = [];
				const cells = tableEl.querySelectorAll(
					".tabulator-row:first-child .tabulator-cell"
				);
				cells.forEach((cell) => {
					const field = cell.getAttribute("tabulator-field");
					if (!field) return;
					const headerEl = tableEl.querySelector(
						'.tabulator-col[tabulator-field="' + field + '"]'
					);
					if (!headerEl) return;
					const cellLeft = cell.getBoundingClientRect().left;
					const headerLeft = headerEl.getBoundingClientRect().left;
					if (Math.abs(cellLeft - headerLeft) > 0.5) {
						out.push({ field, cellLeft, headerLeft, diff: +(cellLeft - headerLeft).toFixed(2) });
					}
				});
				return out;
			}

			// Step left in small increments and verify every visible body cell
			// is horizontally aligned with the column header for the same field.
			const samples = [];
			for (let target = body.scrollLeft - 1; target >= 0; target -= 7) {
				body.scrollLeft = target;
				body.dispatchEvent(new Event("scroll"));
				const mismatches = visibleAlignmentMismatches();
				if (mismatches.length) {
					samples.push({ target, body: body.scrollLeft, mismatches });
				}
				if (samples.length > 5) break;
			}
			return samples;
		});

		if (drift.length) {
			console.log("DRIFT (first 3):", JSON.stringify(drift.slice(0, 3), null, 2));
		}
		expect(drift).toEqual([]);
	});
});
