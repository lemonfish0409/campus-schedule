/* ============================================
   Campus Schedule - Complete Frontend Logic
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // UTILITY HELPERS
    // ==========================================

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function fmtDate(date) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        var w = weekdays[date.getDay()];
        return y + '年' + m + '月' + d + '日 周' + w;
    }

    function fmtDateShort(date) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }

    function isToday(date) {
        var today = new Date();
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    }

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // Week number calculation (ISO-style: Monday of the first week that contains the first Thursday)
    function getMondayOfWeek(date) {
        var d = new Date(date);
        var day = d.getDay();
        var diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    // ==========================================
    // PAGE DETECTION
    // ==========================================

    var pathname = window.location.pathname;
    var isSchedulePage = (pathname === '/' || pathname === '/schedule');
    var isCoursesPage = (pathname === '/courses');

    // ==========================================
    // SCHEDULE PAGE LOGIC
    // ==========================================
    if (isSchedulePage) {
        var selectedDate = new Date();
        selectedDate.setHours(0, 0, 0, 0);

        // Calendar state
        var calYear = selectedDate.getFullYear();
        var calMonth = selectedDate.getMonth(); // 0-indexed

        // DOM refs
        var dateToggleBtn = document.getElementById('dateToggleBtn');
        var dateToggleLabel = document.getElementById('dateToggleLabel');
        var dateChevron = document.getElementById('dateChevron');
        var calendarDropdown = document.getElementById('calendarDropdown');
        var calendarBackdrop = document.getElementById('calendarBackdrop');
        var calMonthLabel = document.getElementById('calMonthLabel');
        var calendarDayGrid = document.getElementById('calendarDayGrid');
        var calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
        var calNextMonthBtn = document.getElementById('calNextMonthBtn');
        var taskList = document.getElementById('taskList');
        var addTaskBtn = document.getElementById('addTaskBtn');
        var taskModalOverlay = document.getElementById('taskModalOverlay');
        var taskTitleInput = document.getElementById('taskTitleInput');
        var prioritySelector = document.getElementById('prioritySelector');
        var editTaskId = document.getElementById('editTaskId');
        var taskModalTitle = document.getElementById('taskModalTitle');
        var saveTaskBtn = document.getElementById('saveTaskBtn');
        var cancelTaskBtn = document.getElementById('cancelTaskBtn');

        // Priority selector default
        var selectedPriority = 'high';

        // --- Calendar Toggle ---
        function openCalendar() {
            calendarDropdown.classList.add('show');
            calendarBackdrop.classList.add('show');
            dateChevron.classList.add('open');
            renderCalendar();
        }
        function closeCalendar() {
            calendarDropdown.classList.remove('show');
            calendarBackdrop.classList.remove('show');
            dateChevron.classList.remove('open');
        }

        dateToggleBtn.addEventListener('click', function () {
            if (calendarDropdown.classList.contains('show')) {
                closeCalendar();
            } else {
                openCalendar();
            }
        });

        calendarBackdrop.addEventListener('click', function () {
            closeCalendar();
        });

        // --- Calendar Navigation ---
        calPrevMonthBtn.addEventListener('click', function () {
            calMonth--;
            if (calMonth < 0) {
                calMonth = 11;
                calYear--;
            }
            renderCalendar();
        });

        calNextMonthBtn.addEventListener('click', function () {
            calMonth++;
            if (calMonth > 11) {
                calMonth = 0;
                calYear++;
            }
            renderCalendar();
        });

        // --- Calendar Render ---
        function renderCalendar() {
            calMonthLabel.textContent = calYear + '年' + (calMonth + 1) + '月';
            calendarDayGrid.innerHTML = '';

            var firstDay = new Date(calYear, calMonth, 1);
            var startDayOfWeek = firstDay.getDay(); // 0=Sun

            var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            var daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

            var today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fill leading cells from previous month
            for (var i = startDayOfWeek - 1; i >= 0; i--) {
                var dayNum = daysInPrevMonth - i;
                var cell = document.createElement('button');
                cell.className = 'calendar-day other-month';
                cell.textContent = dayNum;
                cell.type = 'button';
                calendarDayGrid.appendChild(cell);
            }

            // Fill current month days
            for (var d = 1; d <= daysInMonth; d++) {
                var cell = document.createElement('button');
                cell.className = 'calendar-day';
                cell.textContent = d;
                cell.type = 'button';

                var cellDate = new Date(calYear, calMonth, d);

                if (isToday(cellDate)) {
                    cell.classList.add('today');
                }

                if (isSameDay(cellDate, selectedDate)) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', (function (date) {
                    return function () {
                        selectDate(date);
                    };
                })(new Date(cellDate)));

                calendarDayGrid.appendChild(cell);
            }

            // Fill trailing cells from next month
            var totalCells = startDayOfWeek + daysInMonth;
            var remaining = totalCells % 7;
            if (remaining !== 0) {
                var trailing = 7 - remaining;
                for (var n = 1; n <= trailing; n++) {
                    var cell = document.createElement('button');
                    cell.className = 'calendar-day other-month';
                    cell.textContent = n;
                    cell.type = 'button';
                    calendarDayGrid.appendChild(cell);
                }
            }
        }

        function selectDate(date) {
            selectedDate = date;
            calYear = selectedDate.getFullYear();
            calMonth = selectedDate.getMonth();
            dateToggleLabel.textContent = fmtDate(selectedDate);
            closeCalendar();
            loadTasks();
        }

        // --- Date display init ---
        dateToggleLabel.textContent = fmtDate(selectedDate);

        // --- Load Tasks ---
        function loadTasks() {
            var url = '/api/tasks?date=' + encodeURIComponent(fmtDateShort(selectedDate));

            fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (tasks) {
                renderTasks(tasks);
            })
            .catch(function (error) {
                console.error('Failed to load tasks:', error);
                taskList.innerHTML = '<div class="task-empty"><div class="empty-icon">&#9888;</div><div class="empty-text">加载失败</div><div class="empty-sub">请检查网络连接后重试</div></div>';
            });
        }

        function renderTasks(tasks) {
            if (!tasks || tasks.length === 0) {
                taskList.innerHTML = '<div class="task-empty"><div class="empty-icon">&#128203;</div><div class="empty-text">暂无任务</div><div class="empty-sub">点击下方按钮添加新任务</div></div>';
                return;
            }

            var html = '';
            for (var i = 0; i < tasks.length; i++) {
                var t = tasks[i];
                var isCompleted = t.is_completed ? ' completed' : '';
                var isChecked = t.is_completed ? ' checked' : '';

                var priorityClass = '';
                switch (t.priority) {
                    case 1: priorityClass = 'priority-high'; break;
                    case 2: priorityClass = 'priority-medium'; break;
                    case 3: priorityClass = 'priority-low'; break;
                    default: priorityClass = 'priority-medium'; break;
                }

                html += '<div class="task-item' + isCompleted + '" data-id="' + escapeHtml(String(t.id)) + '">';
                html += '<span class="priority-dot ' + priorityClass + '"></span>';
                html += '<div class="check-circle' + isChecked + '" data-action="toggle" data-id="' + escapeHtml(String(t.id)) + '">';
                html += '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                html += '</div>';
                html += '<div class="task-content"><span class="task-title">' + escapeHtml(t.title) + '</span></div>';
                html += '<button class="task-delete" data-action="delete" data-id="' + escapeHtml(String(t.id)) + '" title="删除">&#10005;</button>';
                html += '</div>';
            }

            taskList.innerHTML = html;

            // Attach event listeners
            var checkCircles = taskList.querySelectorAll('.check-circle[data-action="toggle"]');
            for (var c = 0; c < checkCircles.length; c++) {
                checkCircles[c].addEventListener('click', function (e) {
                    e.stopPropagation();
                    var taskId = this.getAttribute('data-id');
                    toggleTask(taskId);
                });
            }

            var deleteBtns = taskList.querySelectorAll('.task-delete[data-action="delete"]');
            for (var d = 0; d < deleteBtns.length; d++) {
                deleteBtns[d].addEventListener('click', function (e) {
                    e.stopPropagation();
                    var taskId = this.getAttribute('data-id');
                    deleteTask(taskId);
                });
            }
        }

        // --- Toggle Task ---
        function toggleTask(taskId) {
            fetch('/api/tasks/' + taskId + '/toggle', {
                method: 'PATCH',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                loadTasks();
            })
            .catch(function (error) {
                console.error('Failed to toggle task:', error);
            });
        }

        // --- Delete Task ---
        function deleteTask(taskId) {
            if (!confirm('确定要删除这个任务吗？')) {
                return;
            }

            fetch('/api/tasks/' + taskId, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                loadTasks();
            })
            .catch(function (error) {
                console.error('Failed to delete task:', error);
            });
        }

        // --- Add Task ---
        addTaskBtn.addEventListener('click', function () {
            openTaskModal('add');
        });

        function openTaskModal(mode, task) {
            editTaskId.value = '';
            taskTitleInput.value = '';
            selectedPriority = 'high';
            updatePriorityButtons();

            if (mode === 'edit' && task) {
                taskModalTitle.textContent = '编辑任务';
                editTaskId.value = task.id;
                taskTitleInput.value = task.title;
                selectedPriority = task.priority || 'high';
                updatePriorityButtons();
            } else {
                taskModalTitle.textContent = '添加任务';
            }

            taskModalOverlay.classList.add('show');
            setTimeout(function () {
                taskTitleInput.focus();
            }, 300);
        }

        function closeTaskModal() {
            taskModalOverlay.classList.remove('show');
            taskTitleInput.value = '';
            editTaskId.value = '';
        }

        cancelTaskBtn.addEventListener('click', closeTaskModal);

        taskModalOverlay.addEventListener('click', function (e) {
            if (e.target === taskModalOverlay) {
                closeTaskModal();
            }
        });

        // --- Priority Selector ---
        var priorityBtns = prioritySelector.querySelectorAll('.priority-btn');
        for (var pb = 0; pb < priorityBtns.length; pb++) {
            priorityBtns[pb].addEventListener('click', function () {
                selectedPriority = this.getAttribute('data-priority');
                updatePriorityButtons();
            });
        }

        function updatePriorityButtons() {
            var btns = prioritySelector.querySelectorAll('.priority-btn');
            for (var b = 0; b < btns.length; b++) {
                if (btns[b].getAttribute('data-priority') === selectedPriority) {
                    btns[b].classList.add('selected');
                } else {
                    btns[b].classList.remove('selected');
                }
            }
        }

        // --- Save Task ---
        saveTaskBtn.addEventListener('click', function () {
            var title = taskTitleInput.value.trim();
            if (!title) {
                alert('请输入任务名称');
                taskTitleInput.focus();
                return;
            }

            var taskData = {
                title: title,
                priority: { high: 1, medium: 2, low: 3 }[selectedPriority] || 2,
                date: fmtDateShort(selectedDate)
            };

            var editingId = editTaskId.value;
            var method, url;

            if (editingId) {
                method = 'PUT';
                url = '/api/tasks/' + editingId;
            } else {
                method = 'POST';
                url = '/api/tasks';
            }

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(taskData)
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                closeTaskModal();
                loadTasks();
            })
            .catch(function (error) {
                console.error('Failed to save task:', error);
                alert('保存失败，请重试');
            });
        });

        // --- Keyboard: Enter saves task ---
        taskTitleInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTaskBtn.click();
            }
        });

        // Close calendar when clicking outside
        document.addEventListener('click', function (e) {
            if (calendarDropdown.classList.contains('show')) {
                if (!calendarDropdown.contains(e.target) && e.target !== dateToggleBtn && !dateToggleBtn.contains(e.target)) {
                    closeCalendar();
                }
            }
        });

        // --- Initial load ---
        loadTasks();
    }

    // ==========================================
    // COURSES PAGE LOGIC
    // ==========================================
    if (isCoursesPage) {
        var currentWeek = 1;
        var semesterStartDate = null;
        var allCourses = [];
        var selectedCourseWeek = 1; // For week picker

        // Day columns: Sunday=0, Monday=1, ..., Saturday=6
        var dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

        // DOM refs
        var todayDateLabel = document.getElementById('todayDateLabel');
        var weekSelectorLabel = document.getElementById('weekSelectorLabel');
        var weekSelectorBtn = document.getElementById('weekSelectorBtn');
        var settingsGearBtn = document.getElementById('settingsGearBtn');
        var settingsPanel = document.getElementById('settingsPanel');
        var closeSettingsBtn = document.getElementById('closeSettingsBtn');
        var semesterStartInput = document.getElementById('semesterStartInput');
        var saveSemesterBtn = document.getElementById('saveSemesterBtn');
        var courseEditList = document.getElementById('courseEditList');
        var addCourseBtn = document.getElementById('addCourseBtn');

        var courseModalOverlay = document.getElementById('courseModalOverlay');
        var courseModalTitle = document.getElementById('courseModalTitle');
        var courseNameInput = document.getElementById('courseNameInput');
        var courseLocationInput = document.getElementById('courseLocationInput');
        var courseDaySelect = document.getElementById('courseDaySelect');
        var courseSlotSelect = document.getElementById('courseSlotSelect');
        var courseWeeksInput = document.getElementById('courseWeeksInput');
        var courseRemarkInput = document.getElementById('courseRemarkInput');
        var editCourseId = document.getElementById('editCourseId');
        var deleteCourseBtn = document.getElementById('deleteCourseBtn');
        var saveCourseBtn = document.getElementById('saveCourseBtn');
        var cancelCourseBtn = document.getElementById('cancelCourseBtn');

        var weekPickerOverlay = document.getElementById('weekPickerOverlay');
        var weekPickerGrid = document.getElementById('weekPickerGrid');
        var cancelWeekPickerBtn = document.getElementById('cancelWeekPickerBtn');

        // --- Load Config ---
        function loadConfig() {
            fetch('/api/config', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (config) {
                if (config && config.semester_start) {
                    semesterStartDate = new Date(config.semester_start + 'T00:00:00');
                    currentWeek = calculateCurrentWeek(semesterStartDate);
                    if (currentWeek < 1) currentWeek = 1;
                    if (currentWeek > 25) currentWeek = 25;
                } else {
                    currentWeek = 1;
                }
                updateWeekDisplay();
                renderCourseTable();
            })
            .catch(function (error) {
                console.error('Failed to load config:', error);
                currentWeek = 1;
                updateWeekDisplay();
                renderCourseTable();
            });
        }

        function calculateCurrentWeek(startDate) {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            // Find the Monday of the start date's week
            var startMonday = new Date(start);
            var startDay = startMonday.getDay();
            startMonday.setDate(startMonday.getDate() - startDay + (startDay === 0 ? -6 : 1));

            // Find the Monday of today's week
            var todayMonday = new Date(today);
            var todayDay = todayMonday.getDay();
            todayMonday.setDate(todayMonday.getDate() - todayDay + (todayDay === 0 ? -6 : 1));

            var diffMs = todayMonday.getTime() - startMonday.getTime();
            var diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
            return diffWeeks + 1;
        }

        function updateWeekDisplay() {
            weekSelectorLabel.textContent = '第' + currentWeek + '周';

            // Update today label
            var today = new Date();
            var weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            todayDateLabel.textContent = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日 周' + weekdays[today.getDay()];

            // Update day headers with date numbers
            if (semesterStartDate) {
                var startMonday = new Date(semesterStartDate);
                var startDay = startMonday.getDay();
                startMonday.setDate(startMonday.getDate() - startDay + (startDay === 0 ? -6 : 1));

                var weekMonday = new Date(startMonday);
                weekMonday.setDate(weekMonday.getDate() + (currentWeek - 1) * 7);

                var todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);

                for (var d = 1; d <= 7; d++) {
                    var dateNumEl = document.getElementById('dateNum' + d);
                    var dayDate = new Date(weekMonday);
                    dayDate.setDate(dayDate.getDate() + (d - 1));

                    if (dateNumEl) {
                        var dayNum = dayDate.getDate();
                        var isTodayDate = dayDate.getTime() === todayDate.getTime();

                        if (isTodayDate) {
                            dateNumEl.className = 'date-num today-num';
                            dateNumEl.textContent = dayNum;
                        } else {
                            dateNumEl.className = 'date-num';
                            dateNumEl.textContent = dayNum;
                        }
                    }
                }
            } else {
                // Clear date numbers
                for (var dd = 1; dd <= 7; dd++) {
                    var dnEl = document.getElementById('dateNum' + dd);
                    if (dnEl) {
                        dnEl.textContent = '';
                    }
                }
            }
        }

        // --- Render Course Table ---
        function renderCourseTable() {
            var url = '/api/courses?week=' + currentWeek;

            // Clear all cells first
            for (var day = 0; day <= 6; day++) {
                for (var slot = 0; slot <= 5; slot++) {
                    var cell = document.getElementById('cell' + day + '_' + slot);
                    if (cell) {
                        cell.innerHTML = '';
                    }
                }
            }

            fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (courses) {
                allCourses = courses || [];
                var slotTimes = [['08:00','09:40'],['10:00','11:40'],['12:30','14:10'],['14:30','16:10'],['16:30','18:10'],['19:30','21:10']];
                for (var i = 0; i < allCourses.length; i++) {
                    var course = allCourses[i];
                    // Map day_of_week (1=Mon..7=Sun) to cell index (0=Sun,1=Mon..6=Sat)
                    var cellDay = course.day_of_week % 7;
                    // Find slot index from start_time/end_time
                    var slotIdx = -1;
                    for (var si = 0; si < slotTimes.length; si++) {
                        if (slotTimes[si][0] === course.start_time && slotTimes[si][1] === course.end_time) {
                            slotIdx = si;
                            break;
                        }
                    }
                    if (slotIdx === -1) continue;
                    var cellId = 'cell' + cellDay + '_' + slotIdx;
                    var cell = document.getElementById(cellId);
                    if (cell) {
                        var cardHtml = '<div class="course-card">';
                        cardHtml += '<span class="course-name">' + escapeHtml(course.name) + '</span>';
                        if (course.location) {
                            cardHtml += '<span class="course-location">' + escapeHtml(course.location) + '</span>';
                        }
                        cardHtml += '</div>';
                        cell.innerHTML += cardHtml;
                    }
                }
            })
            .catch(function (error) {
                console.error('Failed to load courses:', error);
            });
        }

        // --- Week Selector ---
        weekSelectorBtn.addEventListener('click', function () {
            openWeekPicker();
        });

        function openWeekPicker() {
            selectedCourseWeek = currentWeek;
            renderWeekPicker();
            weekPickerOverlay.classList.add('show');
        }

        function closeWeekPicker() {
            weekPickerOverlay.classList.remove('show');
        }

        cancelWeekPickerBtn.addEventListener('click', closeWeekPicker);

        weekPickerOverlay.addEventListener('click', function (e) {
            if (e.target === weekPickerOverlay) {
                closeWeekPicker();
            }
        });

        function renderWeekPicker() {
            weekPickerGrid.innerHTML = '';

            for (var w = 1; w <= 25; w++) {
                var circle = document.createElement('div');
                circle.className = 'week-picker-circle';
                circle.textContent = w;

                if (w === currentWeek) {
                    circle.classList.add('current');
                }

                if (w === selectedCourseWeek) {
                    circle.classList.add('selected');
                }

                circle.addEventListener('click', (function (weekNum) {
                    return function () {
                        currentWeek = weekNum;
                        updateWeekDisplay();
                        renderCourseTable();
                        closeWeekPicker();
                    };
                })(w));

                weekPickerGrid.appendChild(circle);
            }
        }

        // --- Settings Panel ---
        settingsGearBtn.addEventListener('click', function () {
            openSettingsPanel();
        });

        function openSettingsPanel() {
            // Load current config
            fetch('/api/config', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (config) {
                if (config && config.semester_start) {
                    semesterStartInput.value = config.semester_start;
                }
                loadCourseEditList();
            })
            .catch(function (error) {
                console.error('Failed to load config for settings:', error);
                loadCourseEditList();
            });

            settingsPanel.classList.add('show');
        }

        function closeSettingsPanel() {
            settingsPanel.classList.remove('show');
        }

        closeSettingsBtn.addEventListener('click', closeSettingsPanel);

        // --- Save Semester ---
        saveSemesterBtn.addEventListener('click', function () {
            var newStart = semesterStartInput.value;
            if (!newStart) {
                alert('请选择学期开始日期');
                return;
            }

            fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ semester_start: newStart })
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                semesterStartDate = new Date(newStart + 'T00:00:00');
                currentWeek = calculateCurrentWeek(semesterStartDate);
                if (currentWeek < 1) currentWeek = 1;
                if (currentWeek > 25) currentWeek = 25;
                updateWeekDisplay();
                renderCourseTable();
                alert('学期设置已保存');
            })
            .catch(function (error) {
                console.error('Failed to save config:', error);
                alert('保存失败，请重试');
            });
        });

        // --- Course Edit List ---
        function loadCourseEditList() {
            fetch('/api/courses', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (courses) {
                allCourses = courses || [];
                renderCourseEditList(allCourses);
            })
            .catch(function (error) {
                console.error('Failed to load courses for edit list:', error);
                renderCourseEditList([]);
            });
        }

        var timeSlotLabels = ['08:00-09:40', '10:00-11:40', '12:30-14:10', '14:30-16:10', '16:30-18:10', '19:30-21:10'];

        function renderCourseEditList(courses) {
            if (!courses || courses.length === 0) {
                courseEditList.innerHTML = '<div class="text-muted text-center" style="padding:20px;">暂无课程，点击下方按钮添加</div>';
                return;
            }

            var slotTimes = [['08:00','09:40'],['10:00','11:40'],['12:30','14:10'],['14:30','16:10'],['16:30','18:10'],['19:30','21:10']];
            var html = '';
            for (var i = 0; i < courses.length; i++) {
                var c = courses[i];
                // Map day_of_week 1-7 to display (7=Sun becomes index 0 for dayNames)
                var dayIdx = c.day_of_week % 7;
                var dayLabel = dayNames[dayIdx] || '';
                // Find slot label from start_time/end_time
                var slotLabel = c.start_time + '-' + c.end_time;
                var weeksStr = c.weeks || '';

                html += '<div class="course-edit-item">';
                html += '<div class="course-edit-info">';
                html += '<div class="course-edit-name">' + escapeHtml(c.name) + '</div>';
                html += '<div class="course-edit-meta">' + escapeHtml(dayLabel) + ' ' + slotLabel + ' | ' + escapeHtml(weeksStr) + (c.location ? ' | ' + escapeHtml(c.location) : '') + '</div>';
                html += '</div>';
                html += '<button class="btn-icon btn-edit" data-action="edit-course" data-id="' + escapeHtml(String(c.id)) + '" title="编辑">&#9998;</button>';
                html += '<button class="btn-icon btn-delete-course" data-action="delete-course" data-id="' + escapeHtml(String(c.id)) + '" title="删除">&#128465;</button>';
                html += '</div>';
            }

            courseEditList.innerHTML = html;

            // Attach edit listeners
            var editBtns = courseEditList.querySelectorAll('.btn-edit');
            for (var eb = 0; eb < editBtns.length; eb++) {
                editBtns[eb].addEventListener('click', function () {
                    var courseId = parseInt(this.getAttribute('data-id'));
                    openCourseModal('edit', courseId);
                });
            }

            // Attach delete listeners
            var delBtns = courseEditList.querySelectorAll('.btn-delete-course');
            for (var db = 0; db < delBtns.length; db++) {
                delBtns[db].addEventListener('click', function () {
                    var courseId = parseInt(this.getAttribute('data-id'));
                    deleteCourse(courseId);
                });
            }
        }

        // --- Add Course Button ---
        addCourseBtn.addEventListener('click', function () {
            openCourseModal('add');
        });

        // --- Course Modal ---
        function openCourseModal(mode, courseId) {
            courseModalTitle.textContent = mode === 'add' ? '添加课程' : '编辑课程';
            courseNameInput.value = '';
            courseLocationInput.value = '';
            courseDaySelect.value = '1';
            courseSlotSelect.value = '0';
            courseWeeksInput.value = '';
            courseRemarkInput.value = '';
            editCourseId.value = '';
            deleteCourseBtn.style.display = 'none';

            if (mode === 'edit' && courseId) {
                deleteCourseBtn.style.display = 'block';
                var foundCourse = null;
                for (var i = 0; i < allCourses.length; i++) {
                    if (allCourses[i].id === courseId) {
                        foundCourse = allCourses[i];
                        break;
                    }
                }
                if (foundCourse) {
                    courseNameInput.value = foundCourse.name || '';
                    courseLocationInput.value = foundCourse.location || '';
                    courseDaySelect.value = String(foundCourse.day_of_week);
                    var st = [['08:00','09:40'],['10:00','11:40'],['12:30','14:10'],['14:30','16:10'],['16:30','18:10'],['19:30','21:10']];
                    var foundSlot = 0;
                    for (var si = 0; si < st.length; si++) {
                        if (st[si][0] === foundCourse.start_time && st[si][1] === foundCourse.end_time) {
                            foundSlot = si; break;
                        }
                    }
                    courseSlotSelect.value = String(foundSlot);
                    courseWeeksInput.value = foundCourse.weeks || '';
                    courseRemarkInput.value = foundCourse.remark || '';
                    editCourseId.value = foundCourse.id;
                }
            }

            courseModalOverlay.classList.add('show');
            setTimeout(function () {
                courseNameInput.focus();
            }, 300);
        }

        function closeCourseModal() {
            courseModalOverlay.classList.remove('show');
            courseNameInput.value = '';
            courseLocationInput.value = '';
            courseWeeksInput.value = '';
            courseRemarkInput.value = '';
            editCourseId.value = '';
            deleteCourseBtn.style.display = 'none';
        }

        cancelCourseBtn.addEventListener('click', closeCourseModal);

        courseModalOverlay.addEventListener('click', function (e) {
            if (e.target === courseModalOverlay) {
                closeCourseModal();
            }
        });

        // --- Save Course ---
        saveCourseBtn.addEventListener('click', function () {
            var name = courseNameInput.value.trim();
            if (!name) {
                alert('请输入课程名称');
                courseNameInput.focus();
                return;
            }

            var weeksValue = courseWeeksInput.value.trim();
            if (!weeksValue) {
                alert('请输入周次范围（例如：1-16）');
                courseWeeksInput.focus();
                return;
            }

            var slotTimes = [['08:00','09:40'],['10:00','11:40'],['12:30','14:10'],['14:30','16:10'],['16:30','18:10'],['19:30','21:10']];
            var slotIdx = parseInt(courseSlotSelect.value);
            var courseData = {
                name: name,
                location: courseLocationInput.value.trim(),
                day_of_week: parseInt(courseDaySelect.value),
                start_time: slotTimes[slotIdx][0],
                end_time: slotTimes[slotIdx][1],
                weeks: weeksValue,
                remark: courseRemarkInput.value.trim()
            };

            var editingId = editCourseId.value;
            var method, url;

            if (editingId) {
                method = 'PUT';
                url = '/api/courses/' + editingId;
            } else {
                method = 'POST';
                url = '/api/courses';
            }

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(courseData)
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                closeCourseModal();
                renderCourseTable();
                loadCourseEditList();
            })
            .catch(function (error) {
                console.error('Failed to save course:', error);
                alert('保存失败，请重试');
            });
        });

        // --- Delete Course ---
        deleteCourseBtn.addEventListener('click', function () {
            var editingId = editCourseId.value;
            if (!editingId) return;

            if (!confirm('确定要删除这门课程吗？')) return;

            fetch('/api/courses/' + editingId, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                closeCourseModal();
                renderCourseTable();
                loadCourseEditList();
            })
            .catch(function (error) {
                console.error('Failed to delete course:', error);
                alert('删除失败，请重试');
            });
        });

        function deleteCourse(courseId) {
            if (!confirm('确定要删除这门课程吗？')) return;

            fetch('/api/courses/' + courseId, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function () {
                renderCourseTable();
                loadCourseEditList();
            })
            .catch(function (error) {
                console.error('Failed to delete course:', error);
                alert('删除失败，请重试');
            });
        }

        // --- Keyboard: Enter saves course ---
        var courseInputs = [courseNameInput, courseLocationInput, courseWeeksInput, courseRemarkInput];
        for (var ci = 0; ci < courseInputs.length; ci++) {
            courseInputs[ci].addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveCourseBtn.click();
                }
            });
        }

        // --- Initial load ---
        loadConfig();
    }

})();
