let startTime = null;
let timer = null;

const timerDisplay = document.querySelector("#timer");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const recordList = document.querySelector("#recordList");
const todayTimeDisplay = document.querySelector("#todayTime");

const subjectSelect = document.querySelector("#subject");
const customSubject = document.querySelector("#customSubject");
const subjectRecords = document.querySelector("#subjectRecords");

const toggleButton = document.querySelector("#toggleButton");
const toggleIcon = document.querySelector("#toggleIcon");
const toggleText = document.querySelector("#toggleText");
const recordPanel = document.querySelector("#recordPanel");


// ---------- 共通の関数 ----------

// ミリ秒を hh:mm:ss の文字列に変換
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

// 今日の日付文字列
function getToday() {
    return new Date().toLocaleDateString("ja-JP");
}

// 保存された記録を取得
function loadRecords() {
    try {
        return JSON.parse(localStorage.getItem("studyRecords")) || [];
    } catch (e) {
        return [];
    }
}

// 「科目名 ........ 時間」の行(li)を作る
function createRow(subject, time) {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = subject;

    const timeText = document.createElement("span");
    timeText.className = "row-time";
    timeText.textContent = formatTime(time);

    li.appendChild(name);
    li.appendChild(timeText);

    return li;
}

// 「まだ記録がありません」のメッセージを作る
function createEmptyMessage() {
    const p = document.createElement("p");
    p.className = "empty-message";
    p.textContent = "まだ記録がありません";
    return p;
}


// ---------- パネルの開閉 ----------

function setPanelOpen(isOpen) {
    recordPanel.classList.toggle("open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));

    // 閉じているときはキーボード操作の対象から外す
    recordPanel.inert = !isOpen;

    toggleIcon.textContent = isOpen ? "－" : "＋";
    toggleText.textContent = isOpen ? "閉じる" : "教科を選んでね";
}

toggleButton.addEventListener("click", function () {
    const isOpen = recordPanel.classList.contains("open");
    setPanelOpen(!isOpen);
});


// ---------- 科目選択 ----------

// 「その他」を選んだときだけ入力欄を表示
subjectSelect.addEventListener("change", function () {
    customSubject.hidden = subjectSelect.value !== "other";
});


// ---------- Start / Stop ----------

startButton.addEventListener("click", function () {

    // すでに計測中なら何もしない
    if (timer !== null) return;

    startTime = new Date();

    timer = setInterval(function () {
        timerDisplay.textContent = formatTime(new Date() - startTime);
    }, 1000);

});

stopButton.addEventListener("click", function () {

    // 計測していなければ何もしない
    if (timer === null) return;

    // 科目を取得
    let subject = subjectSelect.value;

    if (subject === "other") {
        subject = customSubject.value.trim();

        // 科目名が空なら保存せず、タイマーも止めない
        if (subject === "") {
            alert("科目を入力してください");
            return;
        }
    }

    clearInterval(timer);
    timer = null;

    const elapsedTime = new Date() - startTime;

    const records = loadRecords();

    records.push({
        date: getToday(),
        subject: subject,
        time: elapsedTime
    });

    localStorage.setItem("studyRecords", JSON.stringify(records));

    // タイマー表示をリセットして、パネルを閉じる
    timerDisplay.textContent = "00:00:00";
    customSubject.value = "";
    setPanelOpen(false);

    updateAll(records);

});


// ---------- 表示 ----------

// 日付ごと・科目ごとの記録を表示
function displayRecords(records) {

    recordList.innerHTML = "";

    if (records.length === 0) {
        recordList.appendChild(createEmptyMessage());
        return;
    }

    // 日付 → 科目 → 合計時間
    const grouped = {};

    records.forEach(function (record) {
        if (!grouped[record.date]) {
            grouped[record.date] = {};
        }
        if (!grouped[record.date][record.subject]) {
            grouped[record.date][record.subject] = 0;
        }
        grouped[record.date][record.subject] += record.time;
    });

    for (let date in grouped) {

        const dateTitle = document.createElement("h3");
        dateTitle.textContent = date;
        recordList.appendChild(dateTitle);

        const ul = document.createElement("ul");
        ul.className = "record-rows";

        for (let subject in grouped[date]) {
            ul.appendChild(createRow(subject, grouped[date][subject]));
        }

        recordList.appendChild(ul);
    }
}

// 今日の合計学習時間を表示
function displayTodayTime(records) {

    const today = getToday();
    let totalTime = 0;

    records.forEach(function (record) {
        if (record.date === today) {
            totalTime += record.time;
        }
    });

    todayTimeDisplay.textContent = formatTime(totalTime);
}

// 今日の科目別学習時間を表示
function displaySubjectRecords(records) {

    subjectRecords.innerHTML = "";

    const today = getToday();
    const subjectTimes = {};

    records.forEach(function (record) {
        if (record.date === today) {
            if (!subjectTimes[record.subject]) {
                subjectTimes[record.subject] = 0;
            }
            subjectTimes[record.subject] += record.time;
        }
    });

    const subjects = Object.keys(subjectTimes);

    if (subjects.length === 0) {
        const li = document.createElement("li");
        li.appendChild(createEmptyMessage());
        subjectRecords.appendChild(li);
        return;
    }

    subjects.forEach(function (subject) {
        subjectRecords.appendChild(createRow(subject, subjectTimes[subject]));
    });
}

// ---------- カレンダー ----------

const calendarTitle = document.querySelector("#calendarTitle");
const calendarGrid = document.querySelector("#calendarGrid");
const prevMonthButton = document.querySelector("#prevMonth");
const nextMonthButton = document.querySelector("#nextMonth");
const dayDetail = document.querySelector("#dayDetail");

const nowDate = new Date();
let calYear = nowDate.getFullYear();
let calMonth = nowDate.getMonth(); // 0〜11（0 = 1月）
let selectedDate = getToday();     // 選んでいる日（最初は今日）
let currentRecords = [];           // 最新の記録を持っておく

// 年・月・日から、保存データと同じ形式の日付文字列を作る
function dateKey(year, month, day) {
    return new Date(year, month, day).toLocaleDateString("ja-JP");
}

// 日付ごとの合計時間を集計
function getDailyTotals(records) {
    const totals = {};

    records.forEach(function (record) {
        if (!totals[record.date]) {
            totals[record.date] = 0;
        }
        totals[record.date] += record.time;
    });

    return totals;
}

// 学習時間の長さを3段階に分ける（色の濃さに使う）
function getLevel(ms) {
    const minutes = ms / 60000;

    if (minutes < 30) return 1;
    if (minutes < 120) return 2;
    return 3;
}

// カレンダーを表示
function renderCalendar(records) {

    calendarTitle.textContent = `${calYear}年${calMonth + 1}月`;
    calendarGrid.innerHTML = "";

    const totals = getDailyTotals(records);
    const today = getToday();

    // 月の1日が何曜日か（0 = 日曜）
    const firstDay = new Date(calYear, calMonth, 1).getDay();

    // その月が何日まであるか
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    // 1日より前の空白マス
    for (let i = 0; i < firstDay; i++) {
        calendarGrid.appendChild(document.createElement("span"));
    }

    for (let day = 1; day <= daysInMonth; day++) {

        const key = dateKey(calYear, calMonth, day);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        button.textContent = day;

        if (totals[key]) {
            button.classList.add("level-" + getLevel(totals[key]));
        }
        if (key === today) {
            button.classList.add("is-today");
        }
        if (key === selectedDate) {
            button.classList.add("is-selected");
        }

        let label = `${calMonth + 1}月${day}日`;
        if (totals[key]) {
            label += `、学習時間 ${formatTime(totals[key])}`;
        }
        button.setAttribute("aria-label", label);

        button.addEventListener("click", function () {
            selectedDate = key;
            renderCalendar(currentRecords);
            renderDayDetail(currentRecords);

            // 再描画で外れたフォーカスを戻す
            const selected = calendarGrid.querySelector(".is-selected");
            if (selected) selected.focus();
        });

        calendarGrid.appendChild(button);
    }
}

// 選んだ日の記録を表示
function renderDayDetail(records) {

    dayDetail.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = selectedDate;
    dayDetail.appendChild(title);

    // 選んだ日の科目別の合計
    const subjectTimes = {};
    let total = 0;

    records.forEach(function (record) {
        if (record.date === selectedDate) {
            if (!subjectTimes[record.subject]) {
                subjectTimes[record.subject] = 0;
            }
            subjectTimes[record.subject] += record.time;
            total += record.time;
        }
    });

    const subjects = Object.keys(subjectTimes);

    if (subjects.length === 0) {
        const p = document.createElement("p");
        p.className = "empty-message";
        p.textContent = "この日の記録はありません";
        dayDetail.appendChild(p);
        return;
    }

    const ul = document.createElement("ul");
    ul.className = "record-rows";

    subjects.forEach(function (subject) {
        ul.appendChild(createRow(subject, subjectTimes[subject]));
    });

    const totalRow = createRow("合計", total);
    totalRow.classList.add("row-total");
    ul.appendChild(totalRow);

    dayDetail.appendChild(ul);
}

// 前の月・次の月
prevMonthButton.addEventListener("click", function () {
    calMonth--;
    if (calMonth < 0) {
        calMonth = 11;
        calYear--;
    }
    renderCalendar(currentRecords);
});

nextMonthButton.addEventListener("click", function () {
    calMonth++;
    if (calMonth > 11) {
        calMonth = 0;
        calYear++;
    }
    renderCalendar(currentRecords);
});


// ---------- 科目ごとの累計グラフ ----------

const subjectChart = document.querySelector("#subjectChart");

function displaySubjectChart(records) {

    subjectChart.innerHTML = "";

    // 科目ごとに、全期間の合計時間を集計
    const totals = {};

    records.forEach(function (record) {
        if (!totals[record.subject]) {
            totals[record.subject] = 0;
        }
        totals[record.subject] += record.time;
    });

    // 長い順に並べ替え
    const entries = Object.entries(totals).sort(function (a, b) {
        return b[1] - a[1];
    });

    if (entries.length === 0) {
        subjectChart.appendChild(createEmptyMessage());
        return;
    }

    // いちばん長い科目を100%として、棒の長さを決める
    const max = entries[0][1];

    entries.forEach(function (entry) {

        const subject = entry[0];
        const time = entry[1];

        const row = document.createElement("div");
        row.className = "chart-row";

        const head = document.createElement("div");
        head.className = "chart-head";

        const name = document.createElement("span");
        name.textContent = subject;

        const timeText = document.createElement("span");
        timeText.className = "chart-time";
        timeText.textContent = formatTime(time);

        head.appendChild(name);
        head.appendChild(timeText);

        const track = document.createElement("div");
        track.className = "chart-track";

        const fill = document.createElement("div");
        fill.className = "chart-fill";
        fill.style.width = (time / max * 100) + "%";

        track.appendChild(fill);
        row.appendChild(head);
        row.appendChild(track);

        subjectChart.appendChild(row);
    });
}


// ---------- まとめて更新 ----------

function updateAll(records) {
    currentRecords = records;

    displayRecords(records);
    displayTodayTime(records);
    displaySubjectRecords(records);
    renderCalendar(records);
    renderDayDetail(records);
    displaySubjectChart(records);
}


// ページ読み込み時に表示
updateAll(loadRecords());


// ---------- 日替わりメッセージ ----------

const dailyMessage = document.querySelector("#dailyMessage");

// 好きなだけ追加・変更できます
const messages = [
    "おはようございますにゃ",
    "今日もひらいてえらいにゃ",
    "いつもがんばっててえらいにゃ～",
    "頑張った日はおいしいものでもたべるにゃ",
    "ちょっときゅうけいにゃ",
    "はろ～",
    "今日はなにするにゃ？",
    "まいにち、コツコツ",
    "努力は報われるにゃ",
    "にゃ～も虫とか飛んでたら集中できないにゃ"
];

// 日付が変わるたびに1つずつ進む番号を作る
function getDayNumber() {
    const now = new Date();
    const utcMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor(utcMs / 86400000);   // 1日 = 86,400,000ミリ秒
}

// 番号を文の数で割った余りで、今日のメッセージを選ぶ
dailyMessage.textContent = messages[getDayNumber() % messages.length];