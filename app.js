// Spark App - Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // App State
    const APP_STATE_KEY = 'sparkAppState';
    let appState = {
        todaySteps: 0,
        stepGoal: 10000,
        streakCount: 0,
        bestStreak: 0,  // Add this line
        lastUpdateDate: null, // For streak calculation
        stepsData: [], // Array of {date, steps} objects
        weightData: [], // Array of {date, weight, unit} objects
        weightUnit: 'lbs', // Default unit
        weightGoal: null // Target weight goal
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
    const stepsDateInput = document.createElement('input');
    stepsDateInput.type = 'date';
    stepsDateInput.id = 'steps-date-input';
    stepsDateInput.className = 'date-input';
    
    const weightInput = document.getElementById('weight-input');
    const weightDateInput = document.createElement('input');
    weightDateInput.type = 'date';
    weightDateInput.id = 'weight-date-input';
    weightDateInput.className = 'date-input';
    
    const weightUnitSelect = document.getElementById('weight-unit-select');
    const goalInput = document.getElementById('goal-input');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const saveStepsBtn = document.getElementById('save-steps-btn');
    const saveWeightBtn = document.getElementById('save-weight-btn');
    const saveGoalBtn = document.getElementById('save-goal-btn');
    
    // Add Date Input to Modals
    const stepsModalBody = document.querySelector('#add-steps-modal .modal-body');
    const weightModalBody = document.querySelector('#add-weight-modal .modal-body');
    
    // Add a container for date selection in steps modal
    const stepsDateContainer = document.createElement('div');
    stepsDateContainer.className = 'date-selection-container';
    
    const stepsDateLabel = document.createElement('label');
    stepsDateLabel.htmlFor = 'steps-date-input';
    stepsDateLabel.textContent = 'Date:';
    
    const stepsDateDefaultBtn = document.createElement('button');
    stepsDateDefaultBtn.className = 'date-default-btn';
    stepsDateDefaultBtn.textContent = 'Today';
    stepsDateDefaultBtn.onclick = (e) => {
        e.preventDefault();
        stepsDateInput.valueAsDate = new Date();
    };
    
    stepsDateContainer.appendChild(stepsDateLabel);
    stepsDateContainer.appendChild(stepsDateInput);
    stepsDateContainer.appendChild(stepsDateDefaultBtn);
    
    // Insert date selection container after the steps input
    stepsModalBody.insertBefore(stepsDateContainer, stepsInput.nextSibling);
    
    // Add a container for date selection in weight modal
    const weightDateContainer = document.createElement('div');
    weightDateContainer.className = 'date-selection-container';
    
    const weightDateLabel = document.createElement('label');
    weightDateLabel.htmlFor = 'weight-date-input';
    weightDateLabel.textContent = 'Date:';
    
    const weightDateDefaultBtn = document.createElement('button');
    weightDateDefaultBtn.className = 'date-default-btn';
    weightDateDefaultBtn.textContent = 'Today';
    weightDateDefaultBtn.onclick = (e) => {
        e.preventDefault();
        weightDateInput.valueAsDate = new Date();
    };
    
    weightDateContainer.appendChild(weightDateLabel);
    weightDateContainer.appendChild(weightDateInput);
    weightDateContainer.appendChild(weightDateDefaultBtn);
    
    // Insert date selection container after the weight input
    const weightInputContainer = document.querySelector('.weight-input-container');
    weightModalBody.insertBefore(weightDateContainer, weightInputContainer.nextSibling);
    
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
        
        // Create awards section in history screen if it doesn't exist
    }
    
    // Load app state from localStorage
    function loadAppState() {
        const savedState = localStorage.getItem(APP_STATE_KEY);
        if (savedState) {
            appState = JSON.parse(savedState);
            
            // Ensure all expected properties exist in loaded appState
            if (!appState.bestStreak) appState.bestStreak = 0;
            if (!appState.weightGoal) appState.weightGoal = null;
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
            // If there was a previous day recorded, we don't need to save it here
            // since steps are now saved by date specifically
            
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
            stepsDateInput.valueAsDate = new Date(); // Default to today
            stepsInput.value = appState.todaySteps; // Default to current steps
            showModal(addStepsModal);
        });
        
        addWeightBtn.addEventListener('click', () => {
            weightDateInput.valueAsDate = new Date(); // Default to today
            
            // If there's recent weight data, set as default
            if (appState.weightData.length > 0) {
                const latestWeight = appState.weightData[appState.weightData.length - 1];
                weightInput.value = latestWeight.weight;
                weightUnitSelect.value = latestWeight.unit;
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
        timeframeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                timeframeToggles.forEach(btn => btn.classList.remove('active'));
                toggle.classList.add('active');
                
                const filter = toggle.getAttribute('data-filter');
                currentTimeframe = filter;
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
        const weightGoalModal = document.getElementById('weight-goal-modal');
    if (weightGoalModal) weightGoalModal.classList.add('hidden');
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) confirmModal.classList.add('hidden');
    }
    
    // Save steps data
    function saveSteps() {
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
                
                // Check if this is a new record streak
                checkAndUpdateStreakAward();
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
        stepsInput.value = '';
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
    
    // Check if current streak is a record and update awards
    function checkAndUpdateStreakAward() {
        // Find existing streak award if any
        const streakAward = appState.awards.find(award => award.type === 'streak');
        
        if (!streakAward && appState.streakCount >= 3) {
            // First time getting a streak of 3+ days
            appState.awards.push({
                type: 'streak',
                value: appState.streakCount,
                date: new Date().toISOString(),
                text: `${appState.streakCount} day streak!`
            });
        } else if (streakAward && appState.streakCount > streakAward.value) {
            // New streak record
            streakAward.value = appState.streakCount;
            streakAward.date = new Date().toISOString();
            streakAward.text = `${appState.streakCount} day streak!`;
        }
    }
    
    // Save weight data
    function saveWeight() {
        const weight = parseFloat(weightInput.value);
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid weight.');
            return;
        }
        
        const unit = weightUnitSelect.value;
        
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
            appState.weightData[existingEntryIndex].unit = unit;
        } else {
            // Add new entry
            appState.weightData.push({
                date: selectedDate,
                weight: weight,
                unit: unit
            });
        }
        
        appState.weightUnit = unit; // Save selected unit
        
        // Check if this is first weight entry or if we reached weight goal
        checkWeightAwards(weight, unit);
        
        saveAppState();
        renderWeightScreen();
        hideAllModals();
        weightInput.value = '';
    }
    
    // Check if weight goals are met for awards
    function checkWeightAwards(weight, unit) {
        if (appState.weightData.length === 1) {
            // First weight entry - add welcome award
            appState.awards.push({
                type: 'first_weight',
                date: new Date().toISOString(),
                text: 'First weight entry! Keep tracking for insights.'
            });
            return;
        }
        
        // Check if weight goal is met
        if (appState.weightGoal) {
            const goalUnit = appState.weightGoal.unit;
            let weightInGoalUnit = weight;
            
            // Convert weight to goal unit if needed
            if (unit !== goalUnit) {
                if (unit === 'kg' && goalUnit === 'lbs') {
                    weightInGoalUnit = weight * 2.20462;
                } else if (unit === 'lbs' && goalUnit === 'kg') {
                    weightInGoalUnit = weight / 2.20462;
                }
            }
            
            const isWeightLossGoal = appState.weightGoal.target < appState.weightGoal.initial;
            
            if ((isWeightLossGoal && weightInGoalUnit <= appState.weightGoal.target) ||
                (!isWeightLossGoal && weightInGoalUnit >= appState.weightGoal.target)) {
                
                // Goal reached!
                const existingGoalAward = appState.awards.find(award => award.type === 'weight_goal');
                
                if (!existingGoalAward) {
                    appState.awards.push({
                        type: 'weight_goal',
                        date: new Date().toISOString(),
                        text: `Weight goal reached! ${appState.weightGoal.target} ${goalUnit}`
                    });
                }
            }
        }
    }
    
    // Save goal setting
    function saveGoal() {
        const goal = parseInt(goalInput.value);
        if (isNaN(goal) || goal < 1000) {
            alert('Please enter a valid step goal (minimum 1000).');
            return;
        }
        
        // If this is a new goal that's higher than previous, add award
        if (goal > appState.stepGoal) {
            appState.awards.push({
                type: 'new_goal',
                value: goal,
                date: new Date().toISOString(),
                text: `New goal set: ${goal.toLocaleString()} steps`
            });
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
        // Update stats cards
        historyGoalEl.textContent = `${appState.stepGoal.toLocaleString()} steps`;
        
        // Make sure we have a best streak in state
        if (!appState.bestStreak) {
            appState.bestStreak = calculateStreak();
        }
        
        historyStreakEl.textContent = `${appState.bestStreak} days`;
        
        // Calculate best day
        let bestDay = 0;
        if (appState.stepsData.length > 0) {
            bestDay = Math.max(...appState.stepsData.map(entry => entry.steps), appState.todaySteps);
        }
        bestDayEl.textContent = `${bestDay.toLocaleString()} steps`;
        
        // Calculate average
        let average = 0;
        if (appState.stepsData.length > 0) {
            const sum = appState.stepsData.reduce((total, entry) => total + entry.steps, 0) + appState.todaySteps;
            average = Math.round(sum / (appState.stepsData.length + 1));
        }
        averageDayEl.textContent = `${average.toLocaleString()} steps`;
        
        renderHistoryChart(currentTimeframe);
        renderStepsHistoryList();
    }
    
    // Render Awards list
    function renderAwards() {
        const awardsList = document.getElementById('awards-list');
        if (!awardsList) return;
        
        awardsList.innerHTML = '';
        
        if (appState.awards.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'Complete goals to earn awards!';
            awardsList.appendChild(emptyMessage);
            return;
        }
        
        // Sort awards by date, newest first
        const sortedAwards = [...appState.awards].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedAwards.forEach((award, index) => {
            const li = document.createElement('li');
            li.className = 'award-item';
            
            const awardDate = new Date(award.date);
            const dateText = awardDate.toLocaleDateString();
            
            li.innerHTML = `
                <div class="award-content">
                    <span class="award-text">${award.text}</span>
                    <span class="award-date">${dateText}</span>
                </div>
                <button class="award-delete" data-index="${index}">&times;</button>
            `;
            
            awardsList.appendChild(li);
        });
    }
    
    // Render Weight Screen
    function renderWeightScreen() {
        // Update current weight display
        if (appState.weightData.length > 0) {
            // Sort by date and get the latest entry
            const sortedData = [...appState.weightData].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            const latestWeight = sortedData[0];
            currentWeightEl.textContent = latestWeight.weight;
            weightUnitEl.textContent = latestWeight.unit;
            weightUnitSelect.value = latestWeight.unit;
        } else {
            currentWeightEl.textContent = '--';
            weightUnitEl.textContent = appState.weightUnit;
            weightUnitSelect.value = appState.weightUnit;
            updateWeightStats();
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
            chartTitle.textContent = 'Daily Steps (3 Months)';
        } else if (timeframe === 'year') {
            chartTitle.textContent = 'Daily Steps (Year)';
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
                days = 365;
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
            const todayStr = today.toISOString().split('T')[0];
            
            // Handle special case for today
            if (dateStr === todayStr) {
                result.values.push(appState.todaySteps);
                result.colors.push(appState.todaySteps >= appState.stepGoal ? '#34C759' : '#007AFF');
            } else if (stepsEntry) {
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
        
        // Add today's steps if not already in data
        const today = new Date().toISOString().split('T')[0];
        const todayExists = stepsDataCopy.some(entry => entry.date === today);
        
        if (!todayExists && appState.todaySteps > 0) {
            stepsDataCopy.push({
                date: today,
                steps: appState.todaySteps
            });
        }
        
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
    function renderWeightChart() {
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
        const goalLine = [];
        
        // Process weight entries
        sortedWeights.forEach(entry => {
            labels.push(formatShortDate(entry.date));
            
            // Convert weight to current unit if needed
            let weightValue = entry.weight;
            if (entry.unit !== appState.weightUnit) {
                if (entry.unit === 'kg' && appState.weightUnit === 'lbs') {
                    weightValue = weightValue * 2.20462;
                } else if (entry.unit === 'lbs' && appState.weightUnit === 'kg') {
                    weightValue = weightValue / 2.20462;
                }
            }
            
            data.push(weightValue);
            
            // Add goal line data if weight goal exists
            if (appState.weightGoal) {
                let goalValue = appState.weightGoal.target;
                if (appState.weightGoal.unit !== appState.weightUnit) {
                    if (appState.weightGoal.unit === 'kg' && appState.weightUnit === 'lbs') {
                        goalValue = goalValue * 2.20462;
                    } else if (appState.weightGoal.unit === 'lbs' && appState.weightUnit === 'kg') {
                        goalValue = goalValue / 2.20462;
                    }
                }
                goalLine.push(goalValue);
            }
        });
        
        // Create datasets array
        const datasets = [
            {
                label: 'Weight',
                data: data,
                fill: false,
                borderColor: '#007AFF',
                backgroundColor: '#007AFF',
                tension: 0.1,
                pointRadius: 4
            }
        ];
        
        // Add goal line if it exists
        if (appState.weightGoal && goalLine.length > 0) {
            datasets.push({
                label: 'Goal',
                data: goalLine,
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
                        beginAtZero: false,
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
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw.toFixed(1) + ' ' + appState.weightUnit;
                            }
                        }
                    }
                }
            }
        });
        
        // Create or update weight stat cards
        updateWeightStats();
    }
    
    // Update weight statistics
    function updateWeightStats() {
        if (appState.weightData.length < 2) return; // Need at least two data points
        
        // Get or create weight stats container
        let statsContainer = document.getElementById('weight-stats-container');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'weight-stats-container';
            statsContainer.className = 'stats-grid';
            
            // Insert before weight history
            const historyHeader = weightScreen.querySelector('.history-list-header');
            weightScreen.insertBefore(statsContainer, historyHeader);
        }
        
        // Clear existing stats
        statsContainer.innerHTML = '';
        
        // Sort data by date
        const sortedWeights = [...appState.weightData]
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Convert all weights to current unit
        const normalizedWeights = sortedWeights.map(entry => {
            let weight = entry.weight;
            if (entry.unit !== appState.weightUnit) {
                if (entry.unit === 'kg' && appState.weightUnit === 'lbs') {
                    weight = weight * 2.20462;
                } else if (entry.unit === 'lbs' && appState.weightUnit === 'kg') {
                    weight = weight / 2.20462;
                }
            }
            return {
                date: entry.date,
                weight: weight
            };
        });
        
        // Initial and latest weight
        const initialWeight = normalizedWeights[0].weight;
        const latestWeight = normalizedWeights[normalizedWeights.length - 1].weight;
        
        // Calculate overall change
        const overallChange = latestWeight - initialWeight;
        const overallChangePercent = (overallChange / initialWeight) * 100;
        
        // Calculate last week change if enough data
        let lastWeekChange = null;
        let lastWeekChangePercent = null;
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
        
        // Find closest entry to one week ago
        const weekAgoEntries = normalizedWeights.filter(entry => entry.date <= oneWeekAgoStr);
        if (weekAgoEntries.length > 0) {
            const weekAgoWeight = weekAgoEntries[weekAgoEntries.length - 1].weight;
            lastWeekChange = latestWeight - weekAgoWeight;
            lastWeekChangePercent = (lastWeekChange / weekAgoWeight) * 100;
        }
        
        // Calculate progress to goal
        let goalProgress = null;
        if (appState.weightGoal) {
            let goalWeight = appState.weightGoal.target;
            // Convert goal to current unit if needed
            if (appState.weightGoal.unit !== appState.weightUnit) {
                if (appState.weightGoal.unit === 'kg' && appState.weightUnit === 'lbs') {
                    goalWeight = goalWeight * 2.20462;
                } else if (appState.weightGoal.unit === 'lbs' && appState.weightUnit === 'kg') {
                    goalWeight = goalWeight / 2.20462;
                }
            }
            
            const totalChange = goalWeight - initialWeight;
            const currentChange = latestWeight - initialWeight;
            
            if (Math.abs(totalChange) > 0) { // Avoid division by zero
                goalProgress = (currentChange / totalChange) * 100;
                // Cap at 100% and handle negative progress
                goalProgress = Math.min(100, Math.max(0, goalProgress));
            }
        }
        
        // Create stat cards
        createStatCard(statsContainer, 'overall change', 
            `${Math.abs(overallChange).toFixed(1)} ${appState.weightUnit} ${overallChange >= 0 ? '↑' : '↓'}`,
            overallChange > 0 ? 'danger-value' : 'success-value');
            
        if (lastWeekChange !== null) {
            createStatCard(statsContainer, 'last 7 days', 
                `${Math.abs(lastWeekChange).toFixed(1)} ${appState.weightUnit} ${lastWeekChange >= 0 ? '↑' : '↓'}`,
                lastWeekChange > 0 ? 'danger-value' : 'success-value');
        }
        
        if (goalProgress !== null) {
            createStatCard(statsContainer, 'goal progress', 
                `${Math.round(goalProgress)}%`,
                'default-value');
        }
        
        // If we have a goal but no goal progress stat, create a set goal card
        if (goalProgress === null && appState.weightGoal === null) {
            createStatCard(statsContainer, 'weight goal', 
                'Set a goal',
                'default-value');
        }
    }
    
    // Create a stat card and append to container
    function createStatCard(container, label, value, valueClass = 'default-value') {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const labelEl = document.createElement('div');
        labelEl.className = 'label';
        labelEl.textContent = label;
        
        const valueEl = document.createElement('div');
        valueEl.className = valueClass;
        valueEl.textContent = value;
        
        card.appendChild(labelEl);
        card.appendChild(valueEl);
        container.appendChild(card);
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
            historyValue.className = 'default-value';
            historyValue.textContent = `${entry.weight} ${entry.unit}`;
            
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
    
    // Add Weight Goal Setting Functionality
    // Completely replace the addWeightGoalSetting function with this:
function addWeightGoalSetting() {
    // Create weight goal modal if it doesn't exist
    if (!document.getElementById('weight-goal-modal')) {
        const weightGoalModal = document.createElement('div');
        weightGoalModal.id = 'weight-goal-modal';
        weightGoalModal.className = 'modal hidden';
        
        weightGoalModal.innerHTML = `
            <div class="modal-header">
                <h2>Set Weight Goal</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <label for="weight-goal-input">Target Weight:</label>
                <div class="weight-input-container">
                    <input type="number" id="weight-goal-input" min="0" step="0.1" placeholder="Enter target weight">
                    <select id="weight-goal-unit-select">
                        <option value="lbs">lbs</option>
                        <option value="kg">kg</option>
                    </select>
                </div>
                <button class="primary-btn full-width" id="save-weight-goal-btn">Save Goal</button>
            </div>
        `;
        
        // Add to modal overlay
        modalOverlay.appendChild(weightGoalModal);
        
        // Add event listeners
        const closeBtn = weightGoalModal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            hideAllModals();
        });
        
        // Save button listener
        const saveWeightGoalBtn = document.getElementById('save-weight-goal-btn');
        if (saveWeightGoalBtn) {
            saveWeightGoalBtn.addEventListener('click', saveWeightGoal);
        }
    }
    
    // Set button click listener
    const weightGoalBtn = document.getElementById('set-weight-goal-btn');
    if (weightGoalBtn) {
        weightGoalBtn.addEventListener('click', () => {
            // If we have a goal, pre-fill form
            const weightGoalInput = document.getElementById('weight-goal-input');
            const weightGoalUnitSelect = document.getElementById('weight-goal-unit-select');
            
            if (appState.weightGoal) {
                weightGoalInput.value = appState.weightGoal.target;
                weightGoalUnitSelect.value = appState.weightGoal.unit;
            } else if (appState.weightData.length > 0) {
                // Default to latest weight unit
                weightGoalUnitSelect.value = appState.weightUnit;
            }
            
            // Make sure only this modal is showing
            hideAllModals();
            modalOverlay.classList.remove('hidden');
            document.getElementById('weight-goal-modal').classList.remove('hidden');
        });
    }
}
    
    // Save Weight Goal
    function saveWeightGoal() {
        const goalInput = document.getElementById('weight-goal-input');
        const unitSelect = document.getElementById('weight-goal-unit-select');
        
        const targetWeight = parseFloat(goalInput.value);
        if (isNaN(targetWeight) || targetWeight <= 0) {
            alert('Please enter a valid weight goal.');
            return;
        }
        
        const unit = unitSelect.value;
        
        // If we don't have weight data, we can't determine if this is a loss or gain goal
        if (appState.weightData.length === 0) {
            alert('Please record your current weight before setting a goal.');
            return;
        }
        
        // Get initial weight (first entry)
        const sortedWeights = [...appState.weightData]
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const initialEntry = sortedWeights[0];
        let initialWeight = initialEntry.weight;
        
        // Convert initial weight to goal unit if needed
        if (initialEntry.unit !== unit) {
            if (initialEntry.unit === 'kg' && unit === 'lbs') {
                initialWeight = initialWeight * 2.20462;
            } else if (initialEntry.unit === 'lbs' && unit === 'kg') {
                initialWeight = initialWeight / 2.20462;
            }
        }
        
        // Save weight goal
        appState.weightGoal = {
            target: targetWeight,
            unit: unit,
            initial: initialWeight,
            date: new Date().toISOString()
        };
        
        // Add a new award for setting a goal
        appState.awards.push({
            type: 'weight_goal_set',
            date: new Date().toISOString(),
            text: `Weight goal set: ${targetWeight} ${unit}`
        });
        
        saveAppState();
        renderWeightScreen();
        hideAllModals();
        goalInput.value = '';
    }
    
    // Add ability to delete history entries
    function addDeletionFunctionality() {
        // Add delete buttons to steps history
        stepsHistoryList.addEventListener('click', function(e) {
            // Check if delete button was clicked
            if (e.target.classList.contains('delete-entry')) {
                const date = e.target.getAttribute('data-date');
                
                // Confirm deletion
                if (confirm('Are you sure you want to delete this entry?')) {
                    // Remove entry from stepsData
                    appState.stepsData = appState.stepsData.filter(entry => entry.date !== date);
                    
                    // If today's entry was deleted, reset todaySteps
                    const today = new Date().toISOString().split('T')[0];
                    if (date === today) {
                        appState.todaySteps = 0;
                    }
                    
                    // Recalculate streak
                    calculateStreak();
                    
                    saveAppState();
                    renderHistoryScreen();
                    renderHomeScreen();
                }
            }
        });
        
        // Add delete buttons to weight history
        weightHistoryList.addEventListener('click', function(e) {
            // Check if delete button was clicked
            if (e.target.classList.contains('delete-entry')) {
                const date = e.target.getAttribute('data-date');
                
                // Confirm deletion
                if (confirm('Are you sure you want to delete this entry?')) {
                    // Remove entry from weightData
                    appState.weightData = appState.weightData.filter(entry => entry.date !== date);
                    
                    saveAppState();
                    renderWeightScreen();
                }
            }
        });
    }
    
    // Export data as JSON
    function setupDataExport() {
        // Create export button in history screen
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-data-btn';
        exportBtn.className = 'secondary-btn';
        exportBtn.textContent = 'Export Data';
        
        // Add to history screen
        historyScreen.appendChild(exportBtn);
        
        // Add event listener
        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(appState, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFilename = 'spark-data-' + new Date().toISOString().split('T')[0] + '.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFilename);
            linkElement.click();
        });
    }
    
    // Import data from JSON
    function setupDataImport() {
        // Create import button in history screen
        const importBtn = document.createElement('button');
        importBtn.id = 'import-data-btn';
        importBtn.className = 'secondary-btn';
        importBtn.textContent = 'Import Data';
        
        // Add to history screen, next to export button
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.parentElement.insertBefore(importBtn, exportBtn.nextSibling);
        } else {
            historyScreen.appendChild(importBtn);
        }
        
        // Create file input (hidden)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'import-file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Add event listeners
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Validate data structure
                    if (!importedData.stepsData || !importedData.weightData || !Array.isArray(importedData.stepsData) || !Array.isArray(importedData.weightData)) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Ask for confirmation
                    if (confirm('This will replace your current data. Are you sure you want to continue?')) {
                        // Backup current data
                        const backupData = JSON.stringify(appState);
                        localStorage.setItem(APP_STATE_KEY + '_backup', backupData);
                        
                        // Apply imported data
                        appState = importedData;
                        
                        // Ensure all expected properties exist
                        if (!appState.awards) appState.awards = [];
                        if (!appState.weightGoal) appState.weightGoal = null;
                        
                        // Update today's steps
                        checkAndUpdateDate();
                        
                        saveAppState();
                        
                        // Refresh UI
                        renderHomeScreen();
                        renderHistoryScreen();
                        renderWeightScreen();
                        
                        alert('Data imported successfully!');
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    alert('Error importing data. Please make sure the file is a valid Spark data export.');
                }
                
                // Reset file input
                fileInput.value = '';
            };
            
            reader.readAsText(file);
        });
    }
    
    // Add CSS styles for new elements
    function addAdditionalStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Date Selection Container */
            .date-selection-container {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                align-items: center;
            }
            
            .date-input {
                flex: 1;
                padding: 12px;
                border: 1px solid var(--light-gray);
                border-radius: 8px;
                font-size: 16px;
            }
            
            .date-default-btn {
                background-color: #f1f3f4;
                border: none;
                padding: 12px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }
            
            /* Awards Section */
            .awards-section {
                margin: 0 16px 80px 16px;
            }
            
            .awards-list {
                list-style: none;
                padding: 0;
            }
            
            .award-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background-color: var(--card-background);
                margin-bottom: 8px;
                border-radius: var(--border-radius);
                box-shadow: var(--card-shadow);
            }
            
            .award-content {
                display: flex;
                flex-direction: column;
            }
            
            .award-text {
                font-weight: 500;
            }
            
            .award-date {
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            
            .award-delete {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--danger-color);
                padding: 4px 8px;
            }
            
            /* Value Classes */
            .success-value {
                color: var(--secondary-color);
                font-weight: 500;
            }
            
            .danger-value {
                color: var(--danger-color);
                font-weight: 500;
            }
            
            /* Secondary Button */
            .secondary-btn {
                background-color: var(--light-gray);
                color: var(--text-color);
                border: none;
                padding: 12px 24px;
                border-radius: 24px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                margin: 8px;
                display: inline-block;
            }
            
            /* Delete Entry Button */
            .delete-entry {
                background: none;
                border: none;
                color: var(--danger-color);
                cursor: pointer;
                padding: 4px;
                margin-left: 8px;
                font-size: 16px;
            }
            
            /* Export/Import Container */
            .data-actions {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin: 16px 0;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Add delete buttons to history items
    function addDeleteButtonsToHistory() {
        // Add a delete button for each history item
        function addDeleteButton(item, date) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-entry';
            deleteBtn.setAttribute('data-date', date);
            deleteBtn.innerHTML = '&times;';
            
            const valueEl = item.querySelector('.default-value, .success-value');
            valueEl.appendChild(deleteBtn);
        }
        
        // Steps history
        const stepsItems = stepsHistoryList.querySelectorAll('.history-item');
        stepsItems.forEach(item => {
            const dateEl = item.querySelector('.history-date');
            if (dateEl) {
                const date = new Date(dateEl.textContent).toISOString().split('T')[0];
                addDeleteButton(item, date);
            }
        });
        
        // Weight history
        const weightItems = weightHistoryList.querySelectorAll('.history-item');
        weightItems.forEach(item => {
            const dateEl = item.querySelector('.history-date');
            if (dateEl) {
                const date = new Date(dateEl.textContent).toISOString().split('T')[0];
                addDeleteButton(item, date);
            }
        });
    }
    // Add clear history functionality
function setupClearHistoryButton() {
    const clearDataBtn = document.getElementById('clear-data-btn');
    
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
                weightUnit: 'lbs',
                weightGoal: null
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

// Helper function to show confirmation modal
function showConfirmModal(message, confirmCallback) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
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
    toast.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type);
    toast.classList.add('visible');
    
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}
    
    // Setup extra features and modifications
    function setupExtraFeatures() {
        addAdditionalStyles();
        addWeightGoalSetting();
        addDeletionFunctionality();
        setupClearHistoryButton();  // Add this line
    }
    
    // Initialize the application
    initApp();
    setupExtraFeatures();
});