
// =====================================
// A+ STUDY TRACKER - JAVASCRIPT
// =====================================

const tasks = [
    { time: "3:30–3:45 AM", name: "Wake up & freshen up", hour: 3, minute: 30, tag: "Morning" },
    { time: "3:45–4:50 AM", name: "Chemistry", hour: 3, minute: 45, tag: "Study" },
    { time: "4:50–5:40 AM", name: "Physics", hour: 4, minute: 50, tag: "Study" },
    { time: "5:40–6:00 AM", name: "Get ready", hour: 5, minute: 40, tag: "Routine" },
    { time: "6:00 AM–1:30 PM", name: "College", hour: 6, minute: 0, tag: "College" },
    { time: "1:30–2:00 PM", name: "Lunch", hour: 13, minute: 30, tag: "Break" },
    { time: "2:00–3:30 PM", name: "Assignments & practical notes", hour: 14, minute: 0, tag: "Study" },
    { time: "3:30–5:00 PM", name: "Mathematics", hour: 15, minute: 30, tag: "Study" },
    { time: "5:00–8:00 PM", name: "Tuition", hour: 17, minute: 0, tag: "Tuition" },
    { time: "8:00–8:30 PM", name: "Dinner", hour: 20, minute: 0, tag: "Break" },
    { time: "8:30–8:45 PM", name: "Rest", hour: 20, minute: 30, tag: "Rest" },
    { time: "8:45–9:45 PM", name: "English & Nepali", hour: 20, minute: 45, tag: "Study" },
    { time: "9:45–10:30 PM", name: "Computer", hour: 21, minute: 45, tag: "Study" },
    { time: "10:30–11:00 PM", name: "Daily revision", hour: 22, minute: 30, tag: "Revision" },
    { time: "11:00–11:30 PM", name: "Wind down", hour: 23, minute: 0, tag: "Rest" },
    { time: "11:30 PM–3:30 AM", name: "Sleep", hour: 23, minute: 30, tag: "Sleep" }
];

const $ = id => document.getElementById(id);

const todayKey = new Date().toLocaleDateString("en-CA");
const storageKey = "aplus-checks-" + todayKey;

let completed = JSON.parse(localStorage.getItem(storageKey) || "{}");
let soundEnabled = true;
let lastCheck = Date.now();
let socialDeadline = Date.now() + 20 * 60 * 1000;

// =====================================
// CLOCK AND DATE
// =====================================

function updateClock() {
    const now = new Date();

    $("clock").textContent =
        now.toLocaleTimeString("en-US", { hour12: true });

    $("date").textContent =
        now.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

setInterval(updateClock, 1000);
updateClock();

// =====================================
// RENDER TIMETABLE
// =====================================

function renderTasks() {
    const container = $("schedule");
    container.innerHTML = "";

    tasks.forEach((task, index) => {
        const isDone = !!completed[index];

        const row = document.createElement("div");
        row.className = "task";
        row.id = "task-" + index;

        if (isDone) row.classList.add("done");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = isDone;

        checkbox.addEventListener("change", () => {
            completed[index] = checkbox.checked;

            localStorage.setItem(
                storageKey,
                JSON.stringify(completed)
            );

            renderTasks();
            updateProgress();
        });

        const time = document.createElement("span");
        time.className = "task-time";
        time.textContent = task.time;

        const name = document.createElement("span");
        name.className = "task-name";
        name.textContent = task.name;

        const tag = document.createElement("span");
        tag.className = "task-tag";
        tag.textContent = task.tag;

        row.append(checkbox, time, name, tag);
        container.appendChild(row);
    });

    updateProgress();
}

function updateProgress() {
    const done = Object.values(completed).filter(Boolean).length;
    const percent = Math.round(done / tasks.length * 100);

    $("completed").textContent = done;
    $("total").textContent = tasks.length;
    $("percentage").textContent = percent + "%";
}

// =====================================
// UPCOMING TASK
// =====================================

function getNextTask() {
    const now = new Date();

    const upcoming = tasks.map((task, index) => {
        const start = new Date(now);
        start.setHours(task.hour, task.minute, 0, 0);

        // Sleep is the last event of the day.
        if (start <= now) {
            start.setDate(start.getDate() + 1);
        }

        return { ...task, index, start };
    }).filter(task => !completed[task.index]);

    upcoming.sort((a, b) => a.start - b.start);

    return upcoming[0];
}

function updateUpcoming() {
    const next = getNextTask();

    if (!next) {
        $("upcomingName").textContent = "All tasks completed!";
        $("upcomingTime").textContent = "Great work today.";
        $("nextTask").textContent = "Complete";
        $("countdown").textContent = "DONE";
        return;
    }

    $("upcomingName").textContent = next.name;
    $("upcomingTime").textContent = next.time;
    $("nextTask").textContent = next.name;

    const seconds = Math.max(
        0,
        Math.floor((next.start - Date.now()) / 1000)
    );

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;

    $("countdown").textContent =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(remaining).padStart(2, "0")}`;

    document.querySelectorAll(".task").forEach(el =>
        el.classList.remove("active")
    );

    const current = tasks.findIndex((task, index) => {
        if (completed[index]) return false;

        const start = new Date();
        start.setHours(task.hour, task.minute, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 5);

        return Date.now() >= start.getTime() &&
               Date.now() < end.getTime();
    });

    if (current !== -1) {
        $("task-" + current)?.classList.add("active");
    }
}

// =====================================
// NOTIFICATIONS
// =====================================

$("notifyBtn").addEventListener("click", async () => {
    if (!("Notification" in window)) {
        alert("Your browser does not support notifications.");
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        notify("Notifications enabled!", "Your study reminders are ready.");
        $("notifyBtn").textContent = "Notifications Enabled";
    } else {
        alert("Please allow notifications in your browser settings.");
    }
});

function notify(title, message) {
    showToast(title, message);

    if ("Notification" in window &&
        Notification.permission === "granted") {
        new Notification(title, {
            body: message,
            icon: ""
        });
    }

    if (soundEnabled) playSound();
}

// =====================================
// IN-PAGE ALERT
// =====================================

let toastTimeout;

function showToast(title, message) {
    const toast = $("toast");

    toast.textContent = title + " — " + message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 8000);
}

// =====================================
// SOUND ALERT
// =====================================

function playSound() {
    try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.frequency.value = 750;
        gain.gain.value = 0.12;

        oscillator.start();

        setTimeout(() => {
            oscillator.stop();
            audio.close();
        }, 400);
    } catch (error) {
        console.log("Sound unavailable", error);
    }
}

$("soundBtn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    $("soundBtn").textContent =
        soundEnabled ? "Sound: ON" : "Sound: OFF";
});

// =====================================
// FIVE-MINUTE AND START ALERTS
// =====================================

const alerted = new Set();

function checkTaskAlerts() {
    const now = Date.now();

    tasks.forEach((task, index) => {
        const start = new Date();
        start.setHours(task.hour, task.minute, 0, 0);

        // If today's task time has already passed, skip it.
        const startTime = start.getTime();

        const fiveMin = startTime - 5 * 60 * 1000;

        const events = [
            {
                time: fiveMin,
                key: index + "-before",
                title: "Upcoming activity",
                message: task.name + " starts in 5 minutes. Get ready!"
            },
            {
                time: startTime,
                key: index + "-start",
                title: "Time to switch!",
                message: "It's time for " + task.name + ". Stay focused!"
            }
        ];

        events.forEach(event => {
            const todayEvent = todayKey + "-" + event.key;

            if (
                lastCheck < event.time &&
                now >= event.time &&
                !alerted.has(todayEvent)
            ) {
                alerted.add(todayEvent);

                if (!completed[index]) {
                    notify(event.title, event.message);
                }
            }
        });
    });

    lastCheck = now;
}

// =====================================
// SOCIAL MEDIA 20-MINUTE REMINDER
// =====================================

function updateSocialTimer() {
    const remaining = Math.max(
        0,
        Math.ceil((socialDeadline - Date.now()) / 1000)
    );

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    $("socialTimer").textContent =
        `${String(mins).padStart(2, "0")}:` +
        `${String(secs).padStart(2, "0")}`;

    if (remaining === 0) {
        notify(
            "Social media check!",
            "Put your phone aside. Your goals need your attention. Return to your priorities!"
        );

        $("socialMessage").textContent =
            "Don't let 20 minutes become another hour.";

        socialDeadline = Date.now() + 20 * 60 * 1000;
    }
}

$("restartSocial").addEventListener("click", () => {
    socialDeadline = Date.now() + 20 * 60 * 1000;
    $("socialMessage").textContent = "Timer restarted. Stay focused!";
});

// =====================================
// FOCUS MODE
// =====================================

$("focusBtn").addEventListener("click", () => {
    document.body.classList.toggle("focus-mode");

    $("focusBtn").textContent =
        document.body.classList.contains("focus-mode")
        ? "Exit Focus Mode"
        : "Enter Focus Mode";
});

// =====================================
// RESET DAILY PROGRESS
// =====================================

$("resetBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset today's progress?")) {
        completed = {};
        localStorage.removeItem(storageKey);

        renderTasks();
        updateUpcoming();
    }
});

// =====================================
// MOTIVATIONAL MESSAGES
// =====================================

const messages = [
    "Your future deserves your attention.",
    "Discipline beats temporary motivation.",
    "One focused session at a time.",
    "Make your efforts count.",
    "Your A+ begins with today's choices."
];

function updateMotivation() {
    const day = new Date().getDate();
    $("motivation").textContent =
        messages[day % messages.length];
}

// =====================================
// START EVERYTHING
// =====================================

renderTasks();
updateMotivation();
updateUpcoming();

setInterval(() => {
    updateUpcoming();
    checkTaskAlerts();
    updateSocialTimer();
}, 1000);

