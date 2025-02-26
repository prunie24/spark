// Spark App - Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // App State
    const APP_STATE_KEY = 'sparkAppState';
    let appState = {
        todaySteps: 0,
        stepGoal: 10000,
        streakCount: 0,
        lastUpdateDate: null, // For streak calculation
        stepsData: [], // Array of {date, steps} objects
        weightData: [], // Array of {date, weight, unit} objects
        weightUnit: 'lbs' // Default unit
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
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const stepsHistoryList = document.getElementById('steps-history-list');
    
    // Weight Screen Elements
    const currentWeightEl = document.getElementById('current-weight');
    const weightUnitEl = document.getElementById('weight-unit');
    const addWeightBtn = document.getElementById('add-weight-btn');
    const weightHistoryList = document.getElementById('weight-history-list');
    
    // Modals
    const modalOverlay = document.getElementById('modal-overlay');
    const addStepsModal = document.getElementById('add-steps-modal');
    const addWeightModal = document.getElementById('add-weight-modal');
    const setGoalModal = document.getElementById('set-goal-modal');
    const closeButtons = document.querySelectorAll('.close-btn');
    
    // Form Elements
    const stepsInput = document.getElementById('steps-input');
    const weightInput = document.getElementById('weight-input');
    const weightUnitSelect = document.getElementById('weight-unit-select');
    const goalInput = document.getElementById('goal-input');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const saveStepsBtn = document.getElementById('save-steps-btn');
    const saveWeightBtn = document.getElementById('save-weight-btn');
    const saveGoalBtn = document.getElementById('save-goal-btn');
    
    // Chart Elements
    const progressRing = document.getElementById('progress-ring');
    const historyChart = document.getElementById('history-chart');
    const weightChart = document.getElementById('weight-chart');
    
    // Chart Instances
    let progressRingChart;
    let historyChartInstance;
    let weightChartInstance;
    
    // Initialize the app
    function initApp() {
        loadAppState();
        renderHomeScreen();
        setupEventListeners();
        showScreen('home-screen'); // Default to home screen
    }
    
    // Load app state from localStorage
    function loadAppState() {
        const savedState = localStorage.getItem(APP_STATE_KEY);
        if (savedState) {
            appState = JSON.parse(savedState);
        }
        
        // Check if we need to update the date for today
        checkAndUpdateDate();
    }
    
    // Save app state to localStorage
    function saveAppState() {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    }
    
    // Check if we need to update the date and reset todaySteps
    function checkAndUpdateDate() {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (appState.lastUpdateDate !== today) {
            // If there was a previous day recorded, save those steps to history
            if (appState.lastUpdateDate && appState.todaySteps > 0) {
                appState.stepsData.push({
                    date: appState.lastUpdateDate,
                    steps: appState.todaySteps
                });
            }
            
            // Reset today's steps for the new day
            appState.todaySteps = 0;
            appState.lastUpdateDate = today;
            saveAppState();
        }
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
        addStepsBtn.addEventListener('click', () => showModal(addStepsModal));
        addWeightBtn.addEventListener('click', () => showModal(addWeightModal));
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
        
        // Save Buttons
        saveStepsBtn.addEventListener('click', saveSteps);
        saveWeightBtn.addEventListener('click', saveWeight);
        saveGoalBtn.addEventListener('click', saveGoal);
        
        // Goal Presets
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetValue = btn.getAttribute('data-value');
                goalInput.value = presetValue;
            });
        });
        
        // History Timeframe Toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all toggles
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked toggle
                btn.classList.add('active');
                // Get the filter type
                const filter = btn.getAttribute('data-filter');
                // Render the appropriate chart
                renderHistoryChart(filter);
            });
        });
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
    }
    
    // Save steps data
    function saveSteps() {
        const steps = parseInt(stepsInput.value);
        if (isNaN(steps) || steps < 0) {
            alert('Please enter a valid step count.');
            return;
        }
        
        appState.todaySteps = steps;
        
        // Update streak if goal is met
        if (steps >= appState.stepGoal) {
            appState.streakCount++;
        } else {
            appState.streakCount = 0; // Reset streak if goal not met
        }
        
        saveAppState();
        renderHomeScreen();
        hideAllModals();
        stepsInput.value = '';
    }
    
    // Save weight data
    function saveWeight() {
        const weight = parseFloat(weightInput.value);
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid weight.');
            return;
        }
        
        const unit = weightUnitSelect.value;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Add weight entry
        appState.weightData.push({
            date: today,
            weight: weight,
            unit: unit
        });
        
        appState.weightUnit = unit; // Save selected unit
        
        saveAppState();
        renderWeightScreen();
        hideAllModals();
        weightInput.value = '';
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
        // Default to weekly view
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === 'week') {
                btn.classList.add('active');
            }
        });
        
        renderHistoryChart('week');
        
        // Update stats cards with actual data
        const historyGoal = document.getElementById('history-goal');
        const historyStreak = document.getElementById('history-streak');
        const bestDay = document.getElementById('best-day');
        const averageDay = document.getElementById('average-day');
        
        // Set goal
        historyGoal.textContent = appState.stepGoal.toLocaleString() + ' steps';
        
        // Calculate best streak (not just current streak)
        let currentStreak = 0;
        let bestStreak = appState.streakCount;
        
        // Sort data by date for streak calculation
        const sortedData = [...appState.stepsData].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Calculate streaks from historical data
        for (let i = 0; i < sortedData.length; i++) {
            if (sortedData[i].steps >= appState.stepGoal) {
                currentStreak++;
                if (currentStreak > bestStreak) {
                    bestStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
        }
        
        // Add today if goal met
        if (appState.todaySteps >= appState.stepGoal) {
            currentStreak++;
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
            }
        }
        
        // Set best streak
        historyStreak.textContent = bestStreak + ' days';
        
        // Calculate best day
        let maxSteps = appState.todaySteps;
        appState.stepsData.forEach(entry => {
            if (entry.steps > maxSteps) {
                maxSteps = entry.steps;
            }
        });
        bestDay.textContent = maxSteps.toLocaleString() + ' steps';
        
        // Calculate average day
        let totalSteps = appState.todaySteps;
        let totalDays = appState.stepsData.length > 0 ? appState.stepsData.length + 1 : 1;
        appState.stepsData.forEach(entry => {
            totalSteps += entry.steps;
        });
        const averageSteps = Math.round(totalSteps / totalDays);
        averageDay.textContent = averageSteps.toLocaleString() + ' steps';
        
        // Render the history list
        renderStepsHistoryList();
    }
    
    // Render Weight Screen
    function renderWeightScreen() {
        // Update current weight display
        if (appState.weightData.length > 0) {
            const latestWeight = appState.weightData[appState.weightData.length - 1];
            currentWeightEl.textContent = latestWeight.weight;
            weightUnitEl.textContent = latestWeight.unit;
            weightUnitSelect.value = latestWeight.unit;
        } else {
            currentWeightEl.textContent = '--';
            weightUnitEl.textContent = appState.weightUnit;
            weightUnitSelect.value = appState.weightUnit;
        }
        
        renderWeightChart();
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
                        '#007AFF', // Primary color for progress
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
                    backgroundColor: '#4285F4', // Consistent blue for all bars
                    borderWidth: 0,
                    borderRadius: 4,
                    maxBarThickness: 35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 10 // Add padding to ensure labels are visible
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.07)'
                        },
                        ticks: {
                            font: {
                                weight: 'bold'
                            },
                            padding: 5,
                            callback: function(value) {
                                if (value === 0) return '0';
                                if (value === 2000) return '2k';
                                if (value === 4000) return '4k';
                                if (value === 6000) return '6k';
                                if (value === 8000) return '8k';
                                if (value === 10000) return '10k';
                                if (value === 12000) return '12k';
                                return '';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                weight: 'bold'
                            },
                            padding: 5 // Add padding for x-axis labels
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
        const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
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
            
            // Format date label with month first, then date (Feb 25 format)
            const dateObj = new Date(dateStr);
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = dateObj.getDate();
            const label = `${month} ${day}`;
            result.labels.push(label);
            
            // Find steps for this date
            const stepsEntry = appState.stepsData.find(entry => entry.date === dateStr);
            const todayStr = today.toISOString().split('T')[0];
            
            // Handle special case for today
            if (dateStr === todayStr) {
                result.values.push(appState.todaySteps);
            } else if (stepsEntry) {
                result.values.push(stepsEntry.steps);
            } else {
                result.values.push(0);
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
        
        // Add today's steps
        const today = new Date().toISOString().split('T')[0];
        stepsDataCopy.push({
            date: today,
            steps: appState.todaySteps
        });
        
        // Sort by date, most recent first
        stepsDataCopy.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display entries
        stepsDataCopy.forEach(entry => {
            const dateObj = new Date(entry.date);
            
            // Format as "Tue, Feb 25" like the example image
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric'
            });
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const historyDate = document.createElement('div');
            historyDate.className = 'history-date';
            historyDate.textContent = formattedDate;
            
            const historyValue = document.createElement('div');
            historyValue.className = entry.steps >= appState.stepGoal ? 'success-value' : 'default-value';
            historyValue.textContent = entry.steps.toLocaleString() + ' steps';
            
            historyItem.appendChild(historyDate);
            historyItem.appendChild(historyValue);
            stepsHistoryList.appendChild(historyItem);
            
            // Make the history item clickable to potentially show more details
            historyItem.addEventListener('click', () => {
                // You could show a modal with more details about that day
                // For now just log to demonstrate functionality
                console.log('Detail view for:', formattedDate, entry.steps + ' steps');
                // In the future, you could implement: showDayDetailModal(entry);
            });
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
    function renderWeightChart() {
        // If chart already exists, destroy it
        if (weightChartInstance) {
            weightChartInstance.destroy();
        }
        
        // If no weight data, don't render chart
        if (appState.weightData.length === 0) {
            return;
        }
        
        // Get the most recent 10 weight entries
        const recentWeights = [...appState.weightData]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .reverse(); // Reverse to show chronological order
        
        const labels = [];
        const data = [];
        
        recentWeights.forEach(entry => {
            const dateObj = new Date(entry.date);
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = dateObj.getDate();
            const label = `${month} ${day}`; // Match history chart format
            labels.push(label);
            
            // Convert to the current unit if needed
            let weightValue = entry.weight;
            if (entry.unit !== appState.weightUnit) {
                if (entry.unit === 'kg' && appState.weightUnit === 'lbs') {
                    weightValue = weightValue * 2.20462;
                } else if (entry.unit === 'lbs' && appState.weightUnit === 'kg') {
                    weightValue = weightValue / 2.20462;
                }
            }
            
            data.push(weightValue);
        });
        
        const ctx = weightChart.getContext('2d');
        weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight',
                    data: data,
                    fill: false,
                    borderColor: '#007AFF',
                    tension: 0.1,
                    pointBackgroundColor: '#007AFF',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 10 // Add padding to ensure labels are visible
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                weight: 'bold'
                            },
                            padding: 5
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                weight: 'bold'
                            },
                            padding: 5 // Add padding for x-axis labels
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw.toFixed(1) + ' ' + appState.weightUnit;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Render Weight History List
    function renderWeightHistoryList() {
        // Clear current list
        weightHistoryList.innerHTML = '';
        
        // Create a copy of weight data, sort by date (most recent first)
        const weightDataCopy = [...appState.weightData]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display entries
        weightDataCopy.forEach(entry => {
            const dateObj = new Date(entry.date);
            const formattedDate = dateObj.toLocaleDateString(undefined, { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const historyDate = document.createElement('div');
            historyDate.className = 'history-date';
            historyDate.textContent = formattedDate;
            
            const historyValue = document.createElement('div');
            historyValue.className = 'default-value';
            historyValue.textContent = entry.weight + ' ' + entry.unit;
            
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
    
    // Initialize the application
    initApp();
});