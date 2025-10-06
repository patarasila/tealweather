const dateInput = document.getElementById('date');
const datePicker = document.getElementById('datePicker');
const cancelBtn = document.querySelector('.cancel-btn');
const okBtn = document.querySelector('.ok-btn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const monthInput = document.getElementById('month-input');
const nextYearBtn = document.getElementById('nextYearBtn');
const prevYearBtn = document.getElementById('prevYearBtn');
const yearInput = document.getElementById('year-input');
const dates = document.querySelector('.dates');
let selectedDate = new Date();
let year = selectedDate.getFullYear();
let month = selectedDate.getMonth();
let maxYear = 2038;
let minYear = 1970;
dateInput.addEventListener('click', () => {
    datePicker.classList.remove('d-none');
});
cancelBtn.addEventListener('click', () => {
    datePicker.classList.add('d-none');
});
okBtn.addEventListener('click', () => {
    // set the selected date to date input
    // dateInput.value = selectedDate.toLocaleDateString('en-US', {
    //     year: 'numeric',
    //     month: '2-digit',
    //     day: '2-digit',
    // });

    dateInput.valueAsNumber = selectedDate.getTime() + 25 * 60 * 60 * 1000;
    datePicker.classList.add('d-none');
    refresh_weather();
});
nextMonthBtn.addEventListener('click', () => {
    if (year === maxYear && month === 11) return;
    if (month === 11) year++;
    month = (month + 1) % 12;
    displayDates();
});
prevMonthBtn.addEventListener('click', () => {
    if (year === minYear && month === 0) return;
    if (month === 0) year--;
    month = (month - 1 + 12) % 12;
    displayDates();
});
nextYearBtn.addEventListener('click', () => {
    if (year === maxYear) return;
    year++;
    displayDates();
});
prevYearBtn.addEventListener('click', () => {
    if (year === minYear) return;
    year--;
    displayDates();
});
monthInput.addEventListener('change', () => {
    month = monthInput.selectedIndex;
    displayDates();
});
yearInput.addEventListener('change', () => {
    year = yearInput.value;
    displayDates();
});
const updateYearMonth = () => {
    monthInput.selectedIndex = month;
    yearInput.value = year;
};
const handleDateClick = (e) => {
    const button = e.target;
    // remove the 'selected' class from other buttons
    const selected = dates.querySelector('.selected');
    selected && selected.classList.remove('selected');
    // add the 'selected' class to current button
    button.classList.add('selected');
    // set the selected date
    selectedDate = new Date(year, month, parseInt(button.textContent));
};
// render the dates in the calendar
const displayDates = () => {
    // update year & month whenever the dates are updated
    updateYearMonth();
    // clear the dates
    dates.innerHTML = '';
    // display the last week of previous month
    // get the last date of the previous month
    const lastOfPrevMonth = new Date(year, month, 0);
    for (let i = 0; i <= lastOfPrevMonth.getDay(); i++) {
        const text = lastOfPrevMonth.getDate() - lastOfPrevMonth.getDay() + i;
        const button = createButton(text, true, false);
        dates.appendChild(button);
    }
    // display the current month
    // get the last date of the current month
    const lastOfMonth = new Date(year, month + 1, 0);
    // console.log(lastOfMonth.toDateString());
    for (let i = 1; i <= lastOfMonth.getDate(); i++) {
        const isToday =
            selectedDate.getDate() === i &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month;
        const button = createButton(i, false, isToday);
        button.addEventListener('click', handleDateClick);
        dates.appendChild(button);
    }
    // display the first week of next month
    // get the first date of the next month
    const firstOfNextMonth = new Date(year, month + 1, 1);
    for (let i = firstOfNextMonth.getDay(); i < 7; i++) {
        const text = firstOfNextMonth.getDate() - firstOfNextMonth.getDay() + i;
        const button = createButton(text, true, false);
        dates.appendChild(button);
    }
};
const createButton = (text, isDisabled = false, isToday = false) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.disabled = isDisabled;
    button.classList.toggle('today', isToday);
    return button;
};
const generateYears = () => {
    const totalYears = maxYear - minYear;
    for (let i = 0; i <= totalYears; i++) {
        const option = document.createElement('option');
        option.textContent = minYear + i;
        option.value = minYear + i;
        yearInput.appendChild(option);
    }
};
generateYears();
displayDates();
