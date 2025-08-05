// Student Planner Application
class StudentPlanner {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('studentPlanner_tasks')) || [];
        this.grades = JSON.parse(localStorage.getItem('studentPlanner_grades')) || [];
        this.classes = JSON.parse(localStorage.getItem('studentPlanner_classes')) || [];
        this.currentDate = new Date();
        this.currentTab = 'dashboard';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderCalendar();
        this.renderTasks();
        this.renderGrades();
        this.renderSchedule();
        this.addSampleData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Modal forms
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.getElementById('grade-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGrade();
        });

        document.getElementById('class-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClass();
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'block') {
                        this.closeModal(modal.id);
                    }
                });
            }
        });
    }

    switchTab(tabName) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Refresh content based on tab
        switch (tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'grades':
                this.renderGrades();
                break;
            case 'schedule':
                this.renderSchedule();
                break;
        }
    }

    // Task Management
    addTask() {
        const task = {
            id: Date.now().toString(),
            title: document.getElementById('task-title').value,
            subject: document.getElementById('task-subject').value,
            dueDate: new Date(document.getElementById('task-due-date').value),
            priority: document.getElementById('task-priority').value,
            description: document.getElementById('task-description').value,
            status: 'pending',
            createdAt: new Date()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateDashboard();
        this.closeModal('task-modal');
        this.clearForm('task-form');
        this.showNotification('Task added successfully!', 'success');
    }

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveTasks();
            this.renderTasks();
            this.updateDashboard();
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateDashboard();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            const statusOrder = ['pending', 'in-progress', 'completed'];
            const currentIndex = statusOrder.indexOf(task.status);
            const nextIndex = (currentIndex + 1) % statusOrder.length;
            this.updateTask(id, { status: statusOrder[nextIndex] });
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-list');
        const filter = document.getElementById('task-filter').value;
        const subjectFilter = document.getElementById('subject-filter').value;

        let filteredTasks = this.tasks;

        // Apply status filter
        if (filter !== 'all') {
            if (filter === 'overdue') {
                filteredTasks = filteredTasks.filter(task => 
                    task.status !== 'completed' && new Date(task.dueDate) < new Date()
                );
            } else {
                filteredTasks = filteredTasks.filter(task => task.status === filter);
            }
        }

        // Apply subject filter
        if (subjectFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.subject === subjectFilter);
        }

        // Sort by due date
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');

        // Update subject filter options
        this.updateSubjectFilter();
    }

    createTaskHTML(task) {
        const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
        const dueDate = new Date(task.dueDate);
        const timeUntilDue = this.getTimeUntilDue(dueDate);

        return `
            <div class="task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-actions">
                        <button class="btn btn-secondary" onclick="planner.toggleTaskStatus('${task.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="planner.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta">
                    <span><i class="fas fa-book"></i> ${task.subject}</span>
                    <span class="${isOverdue ? 'status-overdue' : ''}">
                        <i class="fas fa-clock"></i> ${timeUntilDue}
                    </span>
                    <span class="status-${task.status}">
                        <i class="fas fa-flag"></i> ${task.status.replace('-', ' ').toUpperCase()}
                    </span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
        `;
    }

    updateSubjectFilter() {
        const select = document.getElementById('subject-filter');
        const subjects = [...new Set(this.tasks.map(task => task.subject))];
        
        // Keep current selection
        const currentValue = select.value;
        
        select.innerHTML = '<option value="all">All Subjects</option>' +
            subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('');
        
        // Restore selection if it still exists
        if (subjects.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    // Grade Management
    addGrade() {
        const grade = {
            id: Date.now().toString(),
            subject: document.getElementById('grade-subject').value,
            assignment: document.getElementById('grade-assignment').value,
            score: parseFloat(document.getElementById('grade-score').value),
            total: parseFloat(document.getElementById('grade-total').value),
            credits: parseFloat(document.getElementById('grade-credits').value),
            createdAt: new Date()
        };

        grade.percentage = (grade.score / grade.total) * 100;
        grade.letterGrade = this.calculateLetterGrade(grade.percentage);
        grade.gpaPoints = this.calculateGPAPoints(grade.percentage);

        this.grades.push(grade);
        this.saveGrades();
        this.renderGrades();
        this.updateDashboard();
        this.closeModal('grade-modal');
        this.clearForm('grade-form');
        this.showNotification('Grade added successfully!', 'success');
    }

    calculateLetterGrade(percentage) {
        if (percentage >= 97) return 'A+';
        if (percentage >= 93) return 'A';
        if (percentage >= 90) return 'A-';
        if (percentage >= 87) return 'B+';
        if (percentage >= 83) return 'B';
        if (percentage >= 80) return 'B-';
        if (percentage >= 77) return 'C+';
        if (percentage >= 73) return 'C';
        if (percentage >= 70) return 'C-';
        if (percentage >= 67) return 'D+';
        if (percentage >= 63) return 'D';
        if (percentage >= 60) return 'D-';
        return 'F';
    }

    calculateGPAPoints(percentage) {
        if (percentage >= 97) return 4.0;
        if (percentage >= 93) return 4.0;
        if (percentage >= 90) return 3.7;
        if (percentage >= 87) return 3.3;
        if (percentage >= 83) return 3.0;
        if (percentage >= 80) return 2.7;
        if (percentage >= 77) return 2.3;
        if (percentage >= 73) return 2.0;
        if (percentage >= 70) return 1.7;
        if (percentage >= 67) return 1.3;
        if (percentage >= 63) return 1.0;
        if (percentage >= 60) return 0.7;
        return 0.0;
    }

    calculateGPA() {
        if (this.grades.length === 0) return 0;
        
        let totalPoints = 0;
        let totalCredits = 0;
        
        this.grades.forEach(grade => {
            totalPoints += grade.gpaPoints * grade.credits;
            totalCredits += grade.credits;
        });
        
        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    }

    renderGrades() {
        const container = document.getElementById('grades-list');
        const gpaElement = document.getElementById('overall-gpa');
        const creditsElement = document.getElementById('total-credits');

        // Update summary
        const gpa = this.calculateGPA();
        const totalCredits = this.grades.reduce((sum, grade) => sum + grade.credits, 0);
        
        gpaElement.textContent = gpa;
        creditsElement.textContent = totalCredits;

        // Render grades
        container.innerHTML = this.grades
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(grade => `
                <div class="grade-item">
                    <div class="grade-info">
                        <h4>${grade.subject} - ${grade.assignment}</h4>
                        <p>${grade.credits} credits • ${new Date(grade.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="grade-score">
                        <div class="grade-percentage">${grade.percentage.toFixed(1)}%</div>
                        <div class="grade-letter">${grade.letterGrade}</div>
                    </div>
                </div>
            `).join('');
    }

    // Class Schedule Management
    addClass() {
        const selectedDays = Array.from(document.querySelectorAll('#class-modal input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        const classItem = {
            id: Date.now().toString(),
            name: document.getElementById('class-name').value,
            instructor: document.getElementById('class-instructor').value,
            room: document.getElementById('class-room').value,
            days: selectedDays,
            startTime: document.getElementById('class-start-time').value,
            endTime: document.getElementById('class-end-time').value,
            createdAt: new Date()
        };

        this.classes.push(classItem);
        this.saveClasses();
        this.renderSchedule();
        this.updateDashboard();
        this.closeModal('class-modal');
        this.clearForm('class-form');
        this.showNotification('Class added successfully!', 'success');
    }

    renderSchedule() {
        const container = document.getElementById('schedule-grid');
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const timeSlots = this.generateTimeSlots();

        let html = '<div class="schedule-time"></div>';
        days.forEach(day => {
            html += `<div class="schedule-day">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
        });

        timeSlots.forEach(time => {
            html += `<div class="schedule-time">${time}</div>`;
            days.forEach(day => {
                const classForSlot = this.findClassForSlot(day, time);
                html += `<div class="schedule-slot">
                    ${classForSlot ? `<div class="schedule-class">${classForSlot.name}<br><small>${classForSlot.room}</small></div>` : ''}
                </div>`;
            });
        });

        container.innerHTML = html;
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            slots.push(`${hour}:00`);
        }
        return slots;
    }

    findClassForSlot(day, time) {
        return this.classes.find(classItem => {
            if (!classItem.days.includes(day)) return false;
            
            const slotTime = parseInt(time.split(':')[0]);
            const startTime = parseInt(classItem.startTime.split(':')[0]);
            const endTime = parseInt(classItem.endTime.split(':')[0]);
            
            return slotTime >= startTime && slotTime < endTime;
        });
    }

    // Calendar Management
    renderCalendar() {
        const container = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('current-month-year');
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        monthYear.textContent = `${this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let html = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Add day headers
        dayNames.forEach(day => {
            html += `<div class="calendar-day schedule-day">${day}</div>`;
        });
        
        // Add calendar days
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isToday(currentDate);
            const events = this.getEventsForDate(currentDate);
            
            html += `
                <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    ${events.map(event => `<div class="calendar-event">${event}</div>`).join('')}
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    getEventsForDate(date) {
        const events = [];
        
        // Add tasks due on this date
        this.tasks.forEach(task => {
            const taskDate = new Date(task.dueDate);
            if (this.isSameDate(taskDate, date) && task.status !== 'completed') {
                events.push(`📝 ${task.title}`);
            }
        });
        
        // Add classes on this date
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        this.classes.forEach(classItem => {
            if (classItem.days.includes(dayName)) {
                events.push(`🎓 ${classItem.name}`);
            }
        });
        
        return events;
    }

    // Dashboard Updates
    updateDashboard() {
        this.updateUpcomingDeadlines();
        this.updateGradeOverview();
        this.updateTodayTasks();
        this.updateTodaySchedule();
    }

    updateUpcomingDeadlines() {
        const container = document.getElementById('upcoming-deadlines');
        const upcomingTasks = this.tasks
            .filter(task => task.status !== 'completed' && new Date(task.dueDate) > new Date())
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        container.innerHTML = upcomingTasks.length > 0 
            ? upcomingTasks.map(task => {
                const dueDate = new Date(task.dueDate);
                const timeUntil = this.getTimeUntilDue(dueDate);
                const isUrgent = (dueDate - new Date()) < (24 * 60 * 60 * 1000); // Less than 24 hours
                
                return `
                    <div class="deadline-item">
                        <div class="deadline-title">${task.title}</div>
                        <div class="deadline-date ${isUrgent ? 'urgent' : ''}">${timeUntil}</div>
                    </div>
                `;
            }).join('')
            : '<p>No upcoming deadlines</p>';
    }

    updateGradeOverview() {
        const gpaElement = document.getElementById('current-gpa');
        gpaElement.textContent = this.calculateGPA();
    }

    updateTodayTasks() {
        const container = document.getElementById('today-tasks');
        const today = new Date();
        const todayTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return this.isSameDate(taskDate, today) && task.status !== 'completed';
        });

        container.innerHTML = todayTasks.length > 0
            ? todayTasks.map(task => `
                <div class="task-item priority-${task.priority}">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span>${task.subject}</span>
                        <span class="status-${task.status}">${task.status.replace('-', ' ').toUpperCase()}</span>
                    </div>
                </div>
            `).join('')
            : '<p>No tasks due today</p>';
    }

    updateTodaySchedule() {
        const container = document.getElementById('today-schedule');
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const todayClasses = this.classes
            .filter(classItem => classItem.days.includes(today))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        container.innerHTML = todayClasses.length > 0
            ? todayClasses.map(classItem => `
                <div class="schedule-item">
                    <div class="schedule-class-name">${classItem.name}</div>
                    <div class="schedule-time">${classItem.startTime} - ${classItem.endTime}</div>
                    <div class="schedule-location">${classItem.room}</div>
                </div>
            `).join('')
            : '<p>No classes today</p>';
    }

    // Utility Functions
    getTimeUntilDue(dueDate) {
        const now = new Date();
        const diff = dueDate - now;
        
        if (diff < 0) return 'Overdue';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
        return 'Due soon';
    }

    isToday(date) {
        const today = new Date();
        return this.isSameDate(date, today);
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // Modal Management
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    clearForm(formId) {
        document.getElementById(formId).reset();
    }

    // Data Persistence
    saveTasks() {
        localStorage.setItem('studentPlanner_tasks', JSON.stringify(this.tasks));
    }

    saveGrades() {
        localStorage.setItem('studentPlanner_grades', JSON.stringify(this.grades));
    }

    saveClasses() {
        localStorage.setItem('studentPlanner_classes', JSON.stringify(this.classes));
    }

    // Import/Export
    exportData() {
        const data = {
            tasks: this.tasks,
            grades: this.grades,
            classes: this.classes,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.tasks && data.grades && data.classes) {
                            this.tasks = data.tasks;
                            this.grades = data.grades;
                            this.classes = data.classes;
                            this.saveTasks();
                            this.saveGrades();
                            this.saveClasses();
                            this.init();
                            this.showNotification('Data imported successfully!', 'success');
                        } else {
                            throw new Error('Invalid file format');
                        }
                    } catch (error) {
                        this.showNotification('Error importing data. Please check the file format.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Sample Data
    addSampleData() {
        if (this.tasks.length === 0 && this.grades.length === 0 && this.classes.length === 0) {
            // Add sample tasks
            const sampleTasks = [
                {
                    id: 'sample1',
                    title: 'Complete Math Assignment',
                    subject: 'Mathematics',
                    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    priority: 'high',
                    description: 'Chapter 5 exercises 1-20',
                    status: 'pending',
                    createdAt: new Date()
                },
                {
                    id: 'sample2',
                    title: 'Study for History Exam',
                    subject: 'History',
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    priority: 'medium',
                    description: 'Review chapters 8-12',
                    status: 'in-progress',
                    createdAt: new Date()
                }
            ];

            // Add sample grades
            const sampleGrades = [
                {
                    id: 'grade1',
                    subject: 'Mathematics',
                    assignment: 'Midterm Exam',
                    score: 85,
                    total: 100,
                    credits: 3,
                    percentage: 85,
                    letterGrade: 'B',
                    gpaPoints: 3.0,
                    createdAt: new Date()
                },
                {
                    id: 'grade2',
                    subject: 'History',
                    assignment: 'Research Paper',
                    score: 92,
                    total: 100,
                    credits: 3,
                    percentage: 92,
                    letterGrade: 'A-',
                    gpaPoints: 3.7,
                    createdAt: new Date()
                }
            ];

            // Add sample classes
            const sampleClasses = [
                {
                    id: 'class1',
                    name: 'Mathematics 101',
                    instructor: 'Dr. Smith',
                    room: 'Room 201',
                    days: ['monday', 'wednesday', 'friday'],
                    startTime: '09:00',
                    endTime: '10:00',
                    createdAt: new Date()
                },
                {
                    id: 'class2',
                    name: 'History 101',
                    instructor: 'Prof. Johnson',
                    room: 'Room 305',
                    days: ['tuesday', 'thursday'],
                    startTime: '11:00',
                    endTime: '12:30',
                    createdAt: new Date()
                }
            ];

            this.tasks = sampleTasks;
            this.grades = sampleGrades;
            this.classes = sampleClasses;
            
            this.saveTasks();
            this.saveGrades();
            this.saveClasses();
        }
    }
}

// Global functions for HTML onclick handlers
function showAddTaskModal() {
    planner.showModal('task-modal');
}

function showAddGradeModal() {
    planner.showModal('grade-modal');
}

function showAddClassModal() {
    planner.showModal('class-modal');
}

function closeModal(modalId) {
    planner.closeModal(modalId);
}

function filterTasks() {
    planner.renderTasks();
}

function previousMonth() {
    planner.currentDate.setMonth(planner.currentDate.getMonth() - 1);
    planner.renderCalendar();
}

function nextMonth() {
    planner.currentDate.setMonth(planner.currentDate.getMonth() + 1);
    planner.renderCalendar();
}

function exportData() {
    planner.exportData();
}

function importData() {
    planner.importData();
}

// Initialize the application
let planner;
document.addEventListener('DOMContentLoaded', () => {
    planner = new StudentPlanner();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);