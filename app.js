// Spark App - Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // App State
    const APP_STATE_KEY = 'sparkAppState';
    let appState = {
        todaySteps: 0,
        stepGoal: 10000,
        streakCount: 0,
        bestStreak: 0,
        lastUpdateDate: null, // For streak calculation
        stepsData: [], // Array of {date, steps} objects
        weightData: [], // Array of {date, weight} objects
        weightGoal: null, // Target weight goal
        awards: [] // Initialize awards array
    };
    
    // DOM Elements
    // Screens
    const homeScreen = document.getElementById('home-screen');
    const historyScreen = document.getElementById('history-screen');
    const weightScreen = document.getElementById('weight-screen');
    
    // Navigation
    const tabItems = document.querySelectorAll('.tab-item');
    
    // Home Screen Elements
    const todayStepsEl = document.getElementById('today-steps');
    const remainingStepsEl = document.getElementById('remaining-steps');
    const streakCountEl = document.getElementById('streak-count');
    const addStepsBtn = document.getElementById('add-steps-btn');
    const goalSettingsBtn = document.getElementById('goal-settings');
    
    // History Screen Elements
    const timeframeToggles = document.querySelectorAll('.toggle-btn');
    const stepsHistoryList = document.getElementById('steps-history-list');
    const historyGoalEl = document.getElementById('history-goal');
    const historyStreakEl = document.getElementById('history-streak');
    const bestDayEl = document.getElementById('best-day');
    const averageDayEl = document.getElementById('average-day');
    const chartTitle = document.getElementById('chart-title');
    
    // Weight Screen Elements
    const currentWeightEl = document.getElementById('current-weight');
    const addWeightBtn = document.getElementById('add-weight-btn');
    const weightHistoryList = document.getElementById('weight-history-list');
    const weightGoalValue = document.getElementById('weight-goal-value');
    const weightProgressValue = document.getElementById('weight-progress-value');
    const weightChangeValue = document.getElementById('weight-change-value');
    const showGoalLineToggle = document.getElementById('show-goal-line');
    
    // Modals
    const modalOverlay = document.getElementById('modal-overlay');
    const addStepsModal = document.getElementById('add-steps-modal');
    const addWeightModal = document.getElementById('add-weight-modal');
    const setGoalModal = document.getElementById('set-goal-modal');
    const closeButtons = document.querySelectorAll('.close-btn');
    
    // Form Elements
    const goalInput = document.getElementById('goal-input');
    const presetButtons = document.querySelectorAll('.preset-btn');
    
    // Chart Elements
    const progressRing = document.getElementById('progress-ring');
    const historyChart = document.getElementById('history-chart');
    const weightChart = document.getElementById('weight-chart');
    
    // Chart Instances
    let progressRingChart;
    let historyChartInstance;
    let weightChartInstance;
    
    // Current timeframe for charts
    let currentTimeframe = 'week';
    
    // Initialize the app
    function initApp() {
        loadAppState();
        setupEventListeners();
        checkAndUpdateDate();
        renderHomeScreen();
        showScreen('home-screen'); // Default to home screen
    }
    
    // Load app state from localStorage
    function loadAppState() {
        const savedState = localStorage.getItem(APP_STATE_KEY);
        if (savedState) {
            appState = JSON.parse(savedState);
            
            // Ensure all expected properties exist in loaded appState
            if (!appState.bestStreak) appState.bestStreak = 0;
            if (!appState.weightGoal) appState.weightGoal = null;
            if (!appState.awards) appState.awards = [];
        }
    }
    
    // Save app state to localStorage
    function saveAppState() {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    }
    
    // Check if we need to update the date and reset todaySteps
    function checkAndUpdateDate() {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (appState.lastUpdateDate !== today) {
            // Find today's steps if they exist
            const todayData = appState.stepsData.find(entry => entry.date === today);
            
            if (todayData) {
                appState.todaySteps = todayData.steps;
            } else {
                // Reset today's steps for the new day
                appState.todaySteps = 0;
            }
            
            appState.lastUpdateDate = today;
            saveAppState();
        }
    }
    
    // Format a date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Format a short date (MM/DD)
    function formatShortDate(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    
    // Setup all event listeners
    function setupEventListeners() {
        // Tab Navigation
        tabItems.forEach(item => {
            item.addEventListener('click', () => {
                const screenId = item.getAttribute('data-screen');
                showScreen(screenId);
                
                // Update active tab
                tabItems.forEach(tab => tab.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // Button Clicks
        addStepsBtn.addEventListener('click', () => {
            // Set date input to today
            const stepsDateInput = document.getElementById('steps-date-input');
            if (stepsDateInput) {
                stepsDateInput.valueAsDate = new Date();
            }
            
            // Set steps input to today's steps
            const stepsInput = document.getElementById('steps-input');
            if (stepsInput) {
                stepsInput.value = appState.todaySteps; // Default to current steps
            }
            
            // Add Today button event listener
            const stepsTodayBtn = document.getElementById('steps-today-btn');
            if (stepsTodayBtn) {
                stepsTodayBtn.addEventListener('click', () => {
                    stepsDateInput.valueAsDate = new Date();
                });
            }
            
            // Re-add event listener to the save button
            const saveStepsBtn = document.getElementById('save-steps-btn');
            if (saveStepsBtn) {
                saveStepsBtn.removeEventListener('click', saveSteps);
                saveStepsBtn.addEventListener('click', saveSteps);
            }
            
            showModal(addStepsModal);
        });
        
        addWeightBtn.addEventListener('click', () => {
            // Set date input to today
            const weightDateInput = document.getElementById('weight-date-input');
            if (weightDateInput) {
                weightDateInput.valueAsDate = new Date();
            }
            
            // If there's recent weight data, use it as default
            const weightInput = document.getElementById('weight-input');
            
            if (weightInput) {
                if (appState.weightData.length > 0) {
                    const latestWeight = appState.weightData.sort((a, b) => 
                        new Date(b.date) - new Date(a.date)
                    )[0];
                    weightInput.value = latestWeight.weight;
                } else {
                    weightInput.value = '';
                }
            }
            
            // Add Today button event listener
            const weightTodayBtn = document.getElementById('weight-today-btn');
            if (weightTodayBtn) {
                weightTodayBtn.addEventListener('click', () => {
                    weightDateInput.valueAsDate = new Date();
                });
            }
            
            // Re-add event listener to the save button
            const saveWeightBtn = document.getElementById('save-weight-btn');
            if (saveWeightBtn) {
                saveWeightBtn.removeEventListener('click', saveWeight);
                saveWeightBtn.addEventListener('click', saveWeight);
            }
            
            showModal(addWeightModal);
        });
        
        goalSettingsBtn.addEventListener('click', () => {
            goalInput.value = appState.stepGoal;
            showModal(setGoalModal);
        });
        
        // Modal Close Buttons
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => hideAllModals());
        });
        
        // Click outside modal to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideAllModals();
            }
        });
        
        // Save Goal Button
        const saveGoalBtn = document.getElementById('save-goal-btn');
        if (saveGoalBtn) {
            saveGoalBtn.addEventListener('click', saveGoal);
        }
        
        // Goal Presets
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetValue = btn.getAttribute('data-value');
                goalInput.value = presetValue;
            });
        });
        
        // History Timeframe Toggle
        timeframeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                timeframeToggles.forEach(btn => btn.classList.remove('active'));
                toggle.classList.add('active');
                
                const filter = toggle.getAttribute('data-filter');
                currentTimeframe = filter;
                renderHistoryChart(filter);
            });
        });
        
        // Toggle Goal Line in Weight Chart
        if (showGoalLineToggle) {
            showGoalLineToggle.addEventListener('change', () => {
                renderWeightChart(showGoalLineToggle.checked);
            });
        }
        
        // Set up Weight Goal button
        const setWeightGoalBtn = document.getElementById('set-weight-goal-btn');
        if (setWeightGoalBtn) {
            setWeightGoalBtn.addEventListener('click', () => {
                showWeightGoalModal();
            });
        }
    }
    
    // Show Weight Goal Modal
    function showWeightGoalModal() {
        const weightGoalModal = document.getElementById('weight-goal-modal');
        if (!weightGoalModal) return;
        
        const weightGoalInput = document.getElementById('weight-goal-input');
        
        if (appState.weightGoal) {
            weightGoalInput.value = appState.weightGoal.target;
        } else if (appState.weightData.length > 0) {
            // Leave it blank
            weightGoalInput.value = '';
        }
        
        // Add event listener for save button
        const saveWeightGoalBtn = document.getElementById('save-weight-goal-btn');
        if (saveWeightGoalBtn) {
            saveWeightGoalBtn.removeEventListener('click', saveWeightGoal);
            saveWeightGoalBtn.addEventListener('click', saveWeightGoal);
        }
        
        showModal(weightGoalModal);
    }
    
    // Show a specific screen
    function showScreen(screenId) {
        // Hide all screens
        homeScreen.classList.add('hidden');
        historyScreen.classList.add('hidden');
        weightScreen.classList.add('hidden');
        
        // Show the requested screen
        document.getElementById(screenId).classList.remove('hidden');
        
        // Render the appropriate screen content
        if (screenId === 'home-screen') {
            renderHomeScreen();
        } else if (screenId === 'history-screen') {
            renderHistoryScreen();
        } else if (screenId === 'weight-screen') {
            renderWeightScreen();
        }
    }
    
    // Show a specific modal
    function showModal(modal) {
        modalOverlay.classList.remove('hidden');
        modal.classList.remove('hidden');
    }
    
    // Hide all modals
    function hideAllModals() {
        modalOverlay.classList.add('hidden');
        addStepsModal.classList.add('hidden');
        addWeightModal.classList.add('hidden');
        setGoalModal.classList.add('hidden');
        
        const weightGoalModal = document.getElementById('weight-goal-modal');
        if (weightGoalModal) weightGoalModal.classList.add('hidden');
        
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal) confirmModal.classList.add('hidden');
    }
    
    // Save steps data
    function saveSteps() {
        const stepsInput = document.getElementById('steps-input');
        const stepsDateInput = document.getElementById('steps-date-input');
        
        if (!stepsInput || !stepsDateInput) return;
        
        const steps = parseInt(stepsInput.value);
        if (isNaN(steps) || steps < 0) {
            alert('Please enter a valid step count.');
            return;
        }
        
        // Get selected date or default to today
        let selectedDate = stepsDateInput.value;
        if (!selectedDate) {
            selectedDate = new Date().toISOString().split('T')[0];
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        // Find if entry for this date already exists
        const existingEntryIndex = appState.stepsData.findIndex(entry => entry.date === selectedDate);
        
        if (existingEntryIndex !== -1) {
            // Update existing entry
            appState.stepsData[existingEntryIndex].steps = steps;
        } else {
            // Add new entry
            appState.stepsData.push({
                date: selectedDate,
                steps: steps
            });
        }
        
        // If entry is for today, update todaySteps
        if (selectedDate === today) {
            appState.todaySteps = steps;
            
            // Update streak if goal is met for today
            if (steps >= appState.stepGoal) {
                appState.streakCount++;
                
                // Update best streak if needed
                if (appState.streakCount > appState.bestStreak) {
                    appState.bestStreak = appState.streakCount;
                }
            } else {
                appState.streakCount = 0; // Reset streak if goal not met
            }
        } else {
            // If updating past date, recalculate streak
            calculateStreak();
        }
        
        saveAppState();
        renderHomeScreen();
        hideAllModals();
    }
    
    // Calculate current streak based on sequential days where goal was met
    function calculateStreak() {
        const sortedData = [...appState.stepsData]
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first
        
        const today = new Date().toISOString().split('T')[0];
        let currentStreak = 0;
        let bestStreak = appState.bestStreak || 0; // Get the best streak from state or default to 0
        let currentDate = new Date(today);
        
        // Check if today's steps reach the goal
        const todayData = sortedData.find(entry => entry.date === today);
        if (todayData && todayData.steps >= appState.stepGoal) {
            currentStreak = 1;
            
            // Check previous days
            for (let i = 1; i <= 1000; i++) { // Arbitrary limit to prevent infinite loop
                currentDate.setDate(currentDate.getDate() - 1);
                const dateStr = currentDate.toISOString().split('T')[0];
                
                const dayData = sortedData.find(entry => entry.date === dateStr);
                if (dayData && dayData.steps >= appState.stepGoal) {
                    currentStreak++;
                } else {
                    break; // Streak ends
                }
            }
        }
        
        // Update best streak if current streak is better
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
            appState.bestStreak = bestStreak; // Store best streak in app state
        }
        
        // Still track current streak for internal use
        appState.streakCount = currentStreak;
        
        return bestStreak;
    }
    
    // Save weight data
    function saveWeight() {
        const weightInput = document.getElementById('weight-input');
        const weightDateInput = document.getElementById('weight-date-input');
        
        if (!weightInput || !weightDateInput) return;
        
        const weight = parseFloat(weightInput.value);
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid weight.');
            return;
        }
        
        // Get selected date or default to today
        let selectedDate = weightDateInput.value;
        if (!selectedDate) {
            selectedDate = new Date().toISOString().split('T')[0];
        }
        
        // Find if entry for this date already exists
        const existingEntryIndex = appState.weightData.findIndex(entry => entry.date === selectedDate);
        
        if (existingEntryIndex !== -1) {
            // Update existing entry
            appState.weightData[existingEntryIndex].weight = weight;
        } else {
            // Add new entry
            appState.weightData.push({
                date: selectedDate,
                weight: weight
            });
        }
        
        saveAppState();
        renderWeightScreen();
        hideAllModals();
    }
    
    // Save goal setting
    function saveGoal() {
        const goal = parseInt(goalInput.value);
        if (isNaN(goal) || goal < 1000) {
            alert('Please enter a valid step goal (minimum 1000).');
            return;
        }
        
        appState.stepGoal = goal;
        saveAppState();
        renderHomeScreen();
        hideAllModals();
        goalInput.value = '';
    }
    
    // Save Weight Goal
    function saveWeightGoal() {
        const goalInput = document.getElementById('weight-goal-input');
        
        if (!goalInput) return;
        
        const targetWeight = parseFloat(goalInput.value);
        if (isNaN(targetWeight) || targetWeight <= 0) {
            alert('Please enter a valid weight goal.');
            return;
        }
        
        // If we don't have weight data, we can't determine if this is a loss or gain goal
        if (appState.weightData.length === 0) {
            alert('Please record your current weight before setting a goal.');
            return;
        }
        
        // Get latest weight (most recent entry)
        const sortedWeights = [...appState.weightData]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const initialEntry = sortedWeights[0];
        let initialWeight = initialEntry.weight;
        
        // Save weight goal
        appState.weightGoal = {
            target: targetWeight,
            initial: initialWeight,
            date: new Date().toISOString()
        };
        
        saveAppState();
        renderWeightScreen();
        hideAllModals();
    }
    
    // Render Home Screen
    function renderHomeScreen() {
        todayStepsEl.textContent = appState.todaySteps.toLocaleString();
        streakCountEl.textContent = appState.streakCount;
        
        const remaining = Math.max(0, appState.stepGoal - appState.todaySteps);
        remainingStepsEl.textContent = remaining.toLocaleString();
        
        renderProgressRing();
    }
    
    // Render History Screen
    function renderHistoryScreen() {
        // Update stats cards
        historyGoalEl.textContent = appState.stepGoal.toLocaleString();
        
        // Make sure we have a best streak in state
        if (!appState.bestStreak) {
            appState.bestStreak = calculateStreak();
        }
        
        historyStreakEl.textContent = `${appState.bestStreak} days`;
        
        // Calculate best day
        let bestDay = 0;
        if (appState.stepsData.length > 0) {
            bestDay = Math.max(...appState.stepsData.map(entry => entry.steps), 0);
        }
        bestDayEl.textContent = bestDay.toLocaleString();
        
        // Calculate average
        let average = 0;
        if (appState.stepsData.length > 0) {
            const sum = appState.stepsData.reduce((total, entry) => total + entry.steps, 0);
            average = Math.round(sum / (appState.stepsData.length));
        }
        averageDayEl.textContent = average.toLocaleString();
        
        renderHistoryChart(currentTimeframe);
        renderStepsHistoryList();
    }
    
    // Render Weight Screen
    function renderWeightScreen() {
        // Update current weight display
        if (appState.weightData.length > 0) {
            const sortedData = [...appState.weightData].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            const latestWeight = sortedData[0];
            currentWeightEl.textContent = latestWeight.weight;
        } else {
            currentWeightEl.textContent = '--';
        }
        
        // Update weight stats
        updateWeightStats();
        
        // Show goal line based on toggle state
        const showGoalLine = showGoalLineToggle ? showGoalLineToggle.checked : true;
        renderWeightChart(showGoalLine);
        
        renderWeightHistoryList();
    }
    
    // Render Progress Ring
    function renderProgressRing() {
        // If chart already exists, destroy it
        if (progressRingChart) {
            progressRingChart.destroy();
        }
        
        const ctx = progressRing.getContext('2d');
        const progress = Math.min(1, appState.todaySteps / appState.stepGoal);
        
        progressRingChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [progress, 1 - progress],
                    backgroundColor: [
                        progress >= 1 ? '#34C759' : '#007AFF', // Green if complete, blue otherwise
                        '#E5E5EA'  // Light gray for remaining
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }
    
    // Render History Chart
    function renderHistoryChart(timeframe) {
        // If chart already exists, destroy it
        if (historyChartInstance) {
            historyChartInstance.destroy();
        }
        
        // Update chart title based on timeframe
        if (timeframe === 'week') {
            chartTitle.textContent = 'Daily Steps (Week)';
        } else if (timeframe === 'month') {
            chartTitle.textContent = 'Daily Steps (3 Month)';
        } else if (timeframe === 'year') {
            chartTitle.textContent = 'Daily Steps (6 Month)';
        }
        
        // Get data for the selected timeframe
        const data = getHistoryDataForTimeframe(timeframe);
        
        const ctx = historyChart.getContext('2d');
        historyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Steps',
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value >= 1000 ? (value / 1000) + 'k' : value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw.toLocaleString() + ' steps';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Get history data for the selected timeframe
    function getHistoryDataForTimeframe(timeframe) {
        let days;
        switch (timeframe) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 90; // 3 months
                break;
            case 'year':
                days = 180; // 6 months
                break;
            default:
                days = 7;
        }
        
        const today = new Date();
        const result = {
            labels: [],
            values: [],
            colors: []
        };
        
        // Create an array of the last X days
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Format date label (MM/DD)
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const label = `${month}/${day}`;
            result.labels.push(label);
            
            // Find steps for this date
            const stepsEntry = appState.stepsData.find(entry => entry.date === dateStr);
            
            if (stepsEntry) {
                result.values.push(stepsEntry.steps);
                result.colors.push(stepsEntry.steps >= appState.stepGoal ? '#34C759' : '#007AFF');
            } else {
                result.values.push(0);
                result.colors.push('#E5E5EA');
            }
        }
        
        return result;
    }
    
    // Render Steps History List
    function renderStepsHistoryList() {
        // Clear current list
        stepsHistoryList.innerHTML = '';
        
        // Create a copy of steps data for manipulation
        const stepsDataCopy = [...appState.stepsData];
        
        // Sort by date, most recent first
        stepsDataCopy.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display all entries
        stepsDataCopy.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const historyDate = document.createElement('div');
            historyDate.className = 'history-date';
            historyDate.textContent = formatDate(entry.date);
            
            const historyValue = document.createElement('div');
            historyValue.className = entry.steps >= appState.stepGoal ? 'success-value' : 'default-value';
            historyValue.textContent = entry.steps.toLocaleString() + ' steps';
            
            historyItem.appendChild(historyDate);
            historyItem.appendChild(historyValue);
            stepsHistoryList.appendChild(historyItem);
        });
        
        // If no entries, show a message
        if (stepsDataCopy.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No step data recorded yet.';
            stepsHistoryList.appendChild(emptyMessage);
        }
    }
    
    // Render Weight Chart
    function renderWeightChart(showGoalLine = true) {
        // If chart already exists, destroy it
        if (weightChartInstance) {
            weightChartInstance.destroy();
        }
        
        // If no weight data, show message
        if (appState.weightData.length === 0) {
            const chartContainer = weightChart.parentElement;
            if (!document.getElementById('weight-empty-message')) {
                const emptyMessage = document.createElement('div');
                emptyMessage.id = 'weight-empty-message';
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'No weight data recorded yet.';
                chartContainer.appendChild(emptyMessage);
            }
            return;
        } else {
            // Remove empty message if it exists
            const emptyMessage = document.getElementById('weight-empty-message');
            if (emptyMessage) {
                emptyMessage.remove();
            }
        }
        
        // Sort data by date
        const sortedWeights = [...appState.weightData]
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Chronological
        
        const labels = [];
        const data = [];
        
        // Process weight entries
        sortedWeights.forEach(entry => {
            labels.push(formatShortDate(entry.date));
            data.push(entry.weight);
        });
        
        // Create datasets array
        const datasets = [
            {
                label: 'Weight',
                data: data,
                fill: false,
                borderColor: '#007AFF',
                backgroundColor: '#007AFF',
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ];
        
        // Add goal line if it exists and option is enabled
        if (appState.weightGoal && showGoalLine) {
            let goalValue = appState.weightGoal.target;
            
            // Add goal line
            datasets.push({
                label: 'Goal',
                data: Array(data.length).fill(goalValue),
                fill: false,
                borderColor: '#34C759',
                backgroundColor: '#34C759',
                borderDash: [5, 5],
                tension: 0,
                pointRadius: 0
            });
        }
        
        const ctx = weightChart.getContext('2d');
        weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw.toFixed(1) + ' lb';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update weight statistics
    function updateWeightStats() {
        if (appState.weightData.length < 1) return; // Need at least one data point
        
        // Sort data by date
        const sortedWeights = [...appState.weightData]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Set weight goal display
        if (appState.weightGoal) {
            let goalWeight = appState.weightGoal.target;
            weightGoalValue.textContent = `${goalWeight.toFixed(1)} lb`;
            
            // Calculate progress percentage
            const latestWeight = sortedWeights[0].weight;
            let initialWeight = appState.weightGoal.initial;
            
            const isWeightLossGoal = goalWeight < initialWeight;
            
            let progressPct = 0;
            if (isWeightLossGoal) {
                // Weight loss goal
                if (latestWeight <= goalWeight) {
                    progressPct = 100; // Goal reached or exceeded
                } else {
                    progressPct = ((initialWeight - latestWeight) / (initialWeight - goalWeight)) * 100;
                }
            } else {
                // Weight gain goal
                if (latestWeight >= goalWeight) {
                    progressPct = 100; // Goal reached or exceeded
                } else {
                    progressPct = ((latestWeight - initialWeight) / (goalWeight - initialWeight)) * 100;
                }
            }
            
            // Ensure progress is between 0-100%
            progressPct = Math.max(0, Math.min(100, progressPct));
            
            weightProgressValue.textContent = `${Math.round(progressPct)}%`;
        } else {
            weightGoalValue.textContent = 'Not set';
            weightProgressValue.textContent = `0%`;
        }
        
        // Calculate weekly change (last change between two points)
        if (sortedWeights.length >= 2) {
            const latestWeight = sortedWeights[0].weight;
            const previousWeight = sortedWeights[1].weight;
            
            const weightChange = latestWeight - previousWeight;
            const absChange = Math.abs(weightChange).toFixed(1);
            const changeDirection = weightChange >= 0 ? '↑' : '↓';
            const valueClass = weightChange > 0 ? 'danger-value' : 'green-value';
            
            weightChangeValue.textContent = `${absChange} lb ${changeDirection}`;
            weightChangeValue.className = valueClass;
        } else {
            weightChangeValue.textContent = `0 lb`;
            weightChangeValue.className = 'green-value';
        }
    }
    
    // Render Weight History List
    function renderWeightHistoryList() {
        // Clear current list
        weightHistoryList.innerHTML = '';
        
        // Sort by date, most recent first
        const weightDataCopy = [...appState.weightData]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display entries
        weightDataCopy.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const historyDate = document.createElement('div');
            historyDate.className = 'history-date';
            historyDate.textContent = formatDate(entry.date);
            
            const historyValue = document.createElement('div');
            historyValue.className = 'blue-value';
            historyValue.textContent = `${entry.weight} lb`;
            
            historyItem.appendChild(historyDate);
            historyItem.appendChild(historyValue);
            weightHistoryList.appendChild(historyItem);
        });
        
        // If no entries, show a message
        if (weightDataCopy.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No weight data recorded yet.';
            weightHistoryList.appendChild(emptyMessage);
        }
    }
    
    // Add clear history functionality
    function setupClearHistoryButton() {
        const clearDataBtn = document.getElementById('clear-data-btn');
        
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                showConfirmModal('Are you sure you want to clear all history data? This cannot be undone.', () => {
                    // Preserve current step goal and best streak
                    const stepGoal = appState.stepGoal;
                    const bestStreak = appState.bestStreak;
                    
                    // Reset app state
                    appState = {
                        todaySteps: 0,
                        stepGoal: stepGoal,
                        streakCount: 0,
                        bestStreak: bestStreak,
                        lastUpdateDate: new Date().toISOString().split('T')[0],
                        stepsData: [],
                        weightData: [],
                        weightGoal: null,
                        awards: []
                    };
                    
                    saveAppState();
                    
                    // Refresh all screens
                    renderHomeScreen();
                    renderHistoryScreen();
                    renderWeightScreen();
                    
                    showToast('History data cleared successfully');
                });
            });
        }
    }
    
    // Helper function to show confirmation modal
    function showConfirmModal(message, confirmCallback) {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('confirm-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        
        if (!confirmModal || !confirmMessage || !confirmBtn || !cancelBtn) return;
        
        confirmMessage.textContent = message;
        
        // Set up event handlers
        const handleConfirm = () => {
            confirmCallback();
            hideAllModals();
            // Remove event listeners
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            hideAllModals();
            // Remove event listeners
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        
        showModal(confirmModal);
    }
    
    // Helper function to show toast message
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.classList.add('visible');
        
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }
    
    // Initialize the app
    initApp();
    setupClearHistoryButton();
});