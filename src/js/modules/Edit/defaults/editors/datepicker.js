//custom calendar date picker
export default function(cell, onRendered, success, cancel, editorParams){
	var inputFormat = editorParams.format,
	vertNav = editorParams.verticalNavigation || "editor",
	DT = inputFormat ? (this.table.dependencyRegistry ? this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime") : (window.DateTime || (typeof luxon !== "undefined" ? luxon.DateTime : null))) : null,
	cellValue = cell.getValue(),
	calendarEl = document.createElement("div"),
	calendarVisible = false,
	currentMonth, currentYear, selectedDate;

	///// Value Conversion /////

	function parseDate(value){
		if(!value && value !== 0){
			return null;
		}

		if(value instanceof Date){
			return value;
		}

		if(DT && inputFormat){
			var dt;

			if(DT.isDateTime(value)){
				dt = value;
			}else if(inputFormat === "iso"){
				dt = DT.fromISO(String(value));
			}else{
				dt = DT.fromFormat(String(value), inputFormat);
			}

			if(dt.isValid){
				return dt.toJSDate();
			}

			return null;
		}

		// Parse YYYY-MM-DD as local time (new Date("YYYY-MM-DD") treats it as UTC, causing day shift)
		var str = String(value),
		parts = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

		if(parts){
			return new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
		}

		var parsed = new Date(value);
		return isNaN(parsed.getTime()) ? null : parsed;
	}

	function formatDate(date){
		if(!date){
			return "";
		}

		if(DT && inputFormat){
			var dt = DT.fromJSDate(date);

			switch(inputFormat){
				case true:
					return dt;

				case "iso":
					return dt.toISO();

				default:
					return dt.toFormat(inputFormat);
			}
		}

		return toDisplayString(date);
	}

	function toDisplayString(date){
		if(!date){
			return "";
		}

		var y = date.getFullYear(),
		m = String(date.getMonth() + 1).padStart(2, "0"),
		d = String(date.getDate()).padStart(2, "0");

		return y + "-" + m + "-" + d;
	}

	///// Min/Max /////

	var minDate = parseDate(editorParams.min),
	maxDate = parseDate(editorParams.max);

	function isDateDisabled(date){
		if(minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())){
			return true;
		}

		if(maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59)){
			return true;
		}

		return false;
	}

	///// Calendar Rendering /////

	var dayNames = editorParams.dayNames || ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
	var monthNames = editorParams.monthNames || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	function isSameDay(a, b){
		return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}

	function buildCalendar(){
		var today = new Date();

		calendarEl.innerHTML = "";

		// Header with nav
		var header = document.createElement("div");
		header.classList.add("tabulator-datepicker-header");

		var prevBtn = document.createElement("button");
		prevBtn.type = "button";
		prevBtn.classList.add("tabulator-datepicker-nav-btn");
		prevBtn.textContent = "\u25C0";
		prevBtn.addEventListener("click", function(e){
			e.stopPropagation();
			e.preventDefault();
			navigateMonth(-1);
		});

		var nextBtn = document.createElement("button");
		nextBtn.type = "button";
		nextBtn.classList.add("tabulator-datepicker-nav-btn");
		nextBtn.textContent = "\u25B6";
		nextBtn.addEventListener("click", function(e){
			e.stopPropagation();
			e.preventDefault();
			navigateMonth(1);
		});

		var title = document.createElement("span");
		title.classList.add("tabulator-datepicker-title");
		title.textContent = monthNames[currentMonth] + " ";

		var yearSelect = document.createElement("select");
		yearSelect.classList.add("tabulator-datepicker-year-select");

		var yearRangeStart = editorParams.yearRangeStart || (currentYear - 100),
		yearRangeEnd = editorParams.yearRangeEnd || (currentYear + 10);

		if(minDate && minDate.getFullYear() > yearRangeStart){
			yearRangeStart = minDate.getFullYear();
		}

		if(maxDate && maxDate.getFullYear() < yearRangeEnd){
			yearRangeEnd = maxDate.getFullYear();
		}

		for(var yr = yearRangeEnd; yr >= yearRangeStart; yr--){
			var opt = document.createElement("option");
			opt.value = yr;
			opt.textContent = yr;
			if(yr === currentYear){
				opt.selected = true;
			}
			yearSelect.appendChild(opt);
		}

		yearSelect.addEventListener("change", function(e){
			e.stopPropagation();
			currentYear = parseInt(yearSelect.value);
			buildCalendar();
		});

		yearSelect.addEventListener("mousedown", function(e){
			e.stopPropagation();
		});

		title.appendChild(yearSelect);

		header.appendChild(prevBtn);
		header.appendChild(title);
		header.appendChild(nextBtn);
		calendarEl.appendChild(header);

		// Day name headers
		var dayRow = document.createElement("div");
		dayRow.classList.add("tabulator-datepicker-day-names");

		dayNames.forEach(function(name){
			var dayEl = document.createElement("span");
			dayEl.classList.add("tabulator-datepicker-day-name");
			dayEl.textContent = name;
			dayRow.appendChild(dayEl);
		});

		calendarEl.appendChild(dayRow);

		// Day grid
		var grid = document.createElement("div");
		grid.classList.add("tabulator-datepicker-grid");

		var firstDay = new Date(currentYear, currentMonth, 1).getDay(),
		daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

		for(var i = 0; i < firstDay; i++){
			var empty = document.createElement("span");
			empty.classList.add("tabulator-datepicker-day", "tabulator-datepicker-day-empty");
			grid.appendChild(empty);
		}

		for(var d = 1; d <= daysInMonth; d++){
			(function(day){
				var date = new Date(currentYear, currentMonth, day),
				dayEl = document.createElement("span");

				dayEl.classList.add("tabulator-datepicker-day");
				dayEl.textContent = day;

				if(isSameDay(date, today)){
					dayEl.classList.add("tabulator-datepicker-day-today");
				}

				if(isSameDay(date, selectedDate)){
					dayEl.classList.add("tabulator-datepicker-day-selected");
				}

				if(isDateDisabled(date)){
					dayEl.classList.add("tabulator-datepicker-day-disabled");
				}else{
					dayEl.addEventListener("click", function(e){
						e.stopPropagation();
						e.preventDefault();
						pickDate(date);
					});
				}

				grid.appendChild(dayEl);
			})(d);
		}

		calendarEl.appendChild(grid);

		// Footer buttons
		if(editorParams.todayButton !== false){
			var footer = document.createElement("div");
			footer.classList.add("tabulator-datepicker-footer");

			var todayBtn = document.createElement("button");
			todayBtn.type = "button";
			todayBtn.classList.add("tabulator-datepicker-today-btn");
			todayBtn.textContent = editorParams.todayButtonText || "Today";
			todayBtn.addEventListener("click", function(e){
				e.stopPropagation();
				e.preventDefault();

				if(!isDateDisabled(today)){
					pickDate(today);
				}else{
					currentMonth = today.getMonth();
					currentYear = today.getFullYear();
					buildCalendar();
				}
			});

			footer.appendChild(todayBtn);

			if(editorParams.clearable !== false){
				var clearBtn = document.createElement("button");
				clearBtn.type = "button";
				clearBtn.classList.add("tabulator-datepicker-clear-btn");
				clearBtn.textContent = editorParams.clearButtonText || "Clear";
				clearBtn.addEventListener("click", function(e){
					e.stopPropagation();
					e.preventDefault();
					pickDate(null);
				});
				footer.appendChild(clearBtn);
			}

			calendarEl.appendChild(footer);
		}
	}

	function navigateMonth(offset){
		currentMonth += offset;

		if(currentMonth > 11){
			currentMonth = 0;
			currentYear++;
		}else if(currentMonth < 0){
			currentMonth = 11;
			currentYear--;
		}

		buildCalendar();
	}

	function pickDate(date){
		selectedDate = date;
		input.value = toDisplayString(date);

		hideCalendar();
		onChange();
	}

	///// Calendar positioning — uses fixed positioning for body-margin safety /////

	calendarEl.classList.add("tabulator-datepicker-calendar");

	function positionCalendar(){
		var cellEl = cell.getElement(),
		rect = cellEl.getBoundingClientRect(),
		calHeight = calendarEl.offsetHeight,
		calWidth = calendarEl.offsetWidth,
		viewH = window.innerHeight,
		viewW = window.innerWidth,
		top, left;

		// Default: below the cell
		top = rect.bottom;
		left = rect.left;

		// Flip above if not enough room below
		if(top + calHeight > viewH && rect.top - calHeight > 0){
			top = rect.top - calHeight;
		}

		// Push left if overflowing right edge
		if(left + calWidth > viewW){
			left = viewW - calWidth - 4;
		}

		if(left < 0){
			left = 4;
		}

		calendarEl.style.top = top + "px";
		calendarEl.style.left = left + "px";
	}

	function showCalendar(){
		if(calendarVisible){
			return;
		}

		// Sync to current input
		var parsed = parseDate(input.value);
		if(parsed){
			selectedDate = parsed;
			currentMonth = parsed.getMonth();
			currentYear = parsed.getFullYear();
		}

		buildCalendar();
		document.body.appendChild(calendarEl);
		calendarVisible = true;
		positionCalendar();

		// Dismiss on outside click (delayed so the opening click doesn't trigger it)
		setTimeout(function(){
			document.addEventListener("mousedown", outsideClickHandler);
			window.addEventListener("resize", hideCalendar);
		}, 10);
	}

	function hideCalendar(){
		if(!calendarVisible){
			return;
		}

		calendarVisible = false;
		document.removeEventListener("mousedown", outsideClickHandler);
		window.removeEventListener("resize", hideCalendar);

		if(calendarEl.parentNode){
			calendarEl.parentNode.removeChild(calendarEl);
		}
	}

	function outsideClickHandler(e){
		if(!calendarEl.contains(e.target) && !calBtn.contains(e.target)){
			hideCalendar();
		}
	}

	// Swallow mousedown inside calendar so it doesn't blur the input
	calendarEl.addEventListener("mousedown", function(e){
		e.preventDefault();
		e.stopPropagation();
	});

	///// Input /////

	var input = document.createElement("input");
	input.type = "text";
	input.classList.add("tabulator-datepicker-input");
	input.setAttribute("placeholder", editorParams.placeholder || "YYYY-MM-DD");
	input.style.padding = "4px";
	input.style.width = "100%";
	input.style.boxSizing = "border-box";

	if(editorParams.elementAttributes && typeof editorParams.elementAttributes == "object"){
		for(var key in editorParams.elementAttributes){
			if(key.charAt(0) == "+"){
				key = key.slice(1);
				input.setAttribute(key, input.getAttribute(key) + editorParams.elementAttributes["+" + key]);
			}else{
				input.setAttribute(key, editorParams.elementAttributes[key]);
			}
		}
	}

	///// Calendar button — appended to body with fixed positioning /////

	var calBtn = document.createElement("button");
	calBtn.type = "button";
	calBtn.classList.add("tabulator-datepicker-btn");
	calBtn.setAttribute("tabindex", "-1");
	calBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

	var btnVisible = false;

	function positionButton(){
		var cellRect = cellEl.getBoundingClientRect(),
		viewW = window.innerWidth,
		viewH = window.innerHeight,
		btnSize = 24;

		// Prefer right of cell, then below, then above
		if(cellRect.right + btnSize <= viewW){
			calBtn.style.left = cellRect.right + "px";
			calBtn.style.top = cellRect.top + "px";
			calBtn.style.width = btnSize + "px";
			calBtn.style.height = cellRect.height + "px";
			calBtn.className = "tabulator-datepicker-btn tabulator-datepicker-btn-right";
		}else if(cellRect.bottom + btnSize <= viewH){
			calBtn.style.left = (cellRect.right - btnSize) + "px";
			calBtn.style.top = cellRect.bottom + "px";
			calBtn.style.width = btnSize + "px";
			calBtn.style.height = btnSize + "px";
			calBtn.className = "tabulator-datepicker-btn tabulator-datepicker-btn-below";
		}else{
			calBtn.style.left = (cellRect.right - btnSize) + "px";
			calBtn.style.top = (cellRect.top - btnSize) + "px";
			calBtn.style.width = btnSize + "px";
			calBtn.style.height = btnSize + "px";
			calBtn.className = "tabulator-datepicker-btn tabulator-datepicker-btn-above";
		}
	}

	function showButton(){
		if(!btnVisible){
			document.body.appendChild(calBtn);
			btnVisible = true;
		}
		positionButton();
	}

	function hideButton(){
		if(btnVisible){
			btnVisible = false;
			if(calBtn.parentNode){
				calBtn.parentNode.removeChild(calBtn);
			}
		}
	}

	// Parse initial value
	cellValue = typeof cellValue !== "undefined" ? cellValue : "";
	selectedDate = parseDate(cellValue);

	if(selectedDate){
		currentMonth = selectedDate.getMonth();
		currentYear = selectedDate.getFullYear();
	}else{
		var now = new Date();
		currentMonth = now.getMonth();
		currentYear = now.getFullYear();
	}

	input.value = toDisplayString(selectedDate);

	///// Lifecycle /////

	var cellEl = cell.getElement();

	onRendered(function(){
		if(cell.getType() === "cell"){
			input.focus({preventScroll: true});
			input.style.height = "100%";
			showButton();
		}
	});

	///// Value Change Handling /////

	function cleanupCell(){
		hideButton();
		hideCalendar();
	}

	function onChange(){
		var parsed = parseDate(input.value),
		value;

		selectedDate = parsed;
		value = formatDate(parsed);

		cleanupCell();

		if(((cellValue === null || typeof cellValue === "undefined") && value !== "") || value !== cellValue){
			if(success(value)){
				cellValue = value;
			}
		}else{
			cancel();
		}
	}

	///// Event Listeners /////

	// Calendar button toggles popup
	calBtn.addEventListener("mousedown", function(e){
		e.preventDefault();
		e.stopPropagation();
	});

	calBtn.addEventListener("click", function(e){
		e.stopPropagation();
		e.preventDefault();

		if(calendarVisible){
			hideCalendar();
		}else{
			showCalendar();
		}

		input.focus({preventScroll: true});
	});

	// Blur handling — submit on true blur (not when clicking calendar/button)
	input.addEventListener("blur", function(e){
		// Short delay to let calendar/button click handlers fire first
		setTimeout(function(){
			if(!calendarVisible && !calBtn.matches(":hover")){
				onChange();
			}
		}, 100);
	});

	// Keyboard handling
	input.addEventListener("keydown", function(e){
		switch(e.key){
			case "Enter":
				hideCalendar();
				onChange();
				break;

			case "Escape":
				if(calendarVisible){
					hideCalendar();
					e.stopPropagation();
				}else{
					cleanupCell();
					cancel();
				}
				break;

			case "End":
			case "Home":
				e.stopPropagation();
				break;

			case "ArrowUp":
			case "ArrowDown":
				if(vertNav == "editor"){
					e.stopImmediatePropagation();
					e.stopPropagation();
				}
				break;
		}
	});

	return input;
}
