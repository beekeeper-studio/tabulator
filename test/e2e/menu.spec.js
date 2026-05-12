// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Context menu viewport bounds", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/test/e2e/menu.html");
		await page.waitForSelector(".tabulator-row");
	});

	const margin = 5;
	const corners = [
		{ name: "top-left", offsetX: margin, offsetY: 50 },
		{ name: "top-right", offsetX: -margin, offsetY: 50 },
		{ name: "bottom-left", offsetX: margin, offsetY: -margin },
		{ name: "bottom-right", offsetX: -margin, offsetY: -margin },
	];

	for (const corner of corners) {
		test(`menu stays inside viewport when opened near ${corner.name}`, async ({ page }) => {
			const viewport = page.viewportSize();
			const x = corner.offsetX < 0 ? viewport.width + corner.offsetX : corner.offsetX;
			const y = corner.offsetY < 0 ? viewport.height + corner.offsetY : corner.offsetY;

			await page.evaluate(({ x, y }) => {
				const el = document.elementFromPoint(x, y);
				el.dispatchEvent(new MouseEvent("contextmenu", {
					bubbles: true,
					cancelable: true,
					view: window,
					button: 2,
					clientX: x,
					clientY: y,
				}));
			}, { x, y });

			const menu = page.locator(".tabulator-menu");
			await expect(menu).toBeVisible();

			const box = await menu.boundingBox();
			expect(box).not.toBeNull();
			expect(box.x).toBeGreaterThanOrEqual(0);
			expect(box.y).toBeGreaterThanOrEqual(0);
			expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
			expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
		});
	}
});
