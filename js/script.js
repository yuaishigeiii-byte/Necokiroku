let startTime;
let timer;
let saveTime = 0; // 経過時間を保存しておく箱

const timerDisplay = document.querySelector("#timer");
const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const recordList = document.querySelector("#recordList");
const todayTimeDisplay = document.querySelector("#todayTime");

const subjectSelect = document.querySelector("#subject");
const customSubject = document.querySelector("#customSubject");
const subjectRecords = document.querySelector("#subjectRecords");


// 「その他」を選んだときだけ入力欄を表示
subjectSelect.addEventListener("change", function() {

    if (subjectSelect.value === "other") {
        customSubject.style.display = "inline-block";
    } else {
        customSubject.style.display = "none";
    }

});


// Startボタン
startButton.addEventListener("click", function() {

    startTime = new Date();

    timer = setInterval(function() {

        const now = new Date();
        const elapsedTime = now - startTime;

        const totalSeconds = Math.floor(elapsedTime / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const h = String(hours).padStart(2, "0");
        const m = String(minutes).padStart(2, "0");
        const s = String(seconds).padStart(2, "0");

        timerDisplay.textContent = `${h}:${m}:${s}`;

    }, 1000);

});


// Stopボタン
stopButton.addEventListener("click", function() {

    clearInterval(timer);

    const endTime = new Date();

    const elapsedTime = endTime - startTime;


    // 科目を取得
    let subject = subjectSelect.value;


    // 「その他」の場合は入力した科目を使う
    if (subject === "other") {
        subject = customSubject.value;
    }


    // localStorageから今までの記録を取得
    let records = JSON.parse(
        localStorage.getItem("studyRecords")
    ) || [];


    // 今日の日付を取得
    const date = new Date().toLocaleDateString("ja-JP");


    // 新しい記録を追加
    records.push({
        date: date,
        subject: subject,
        time: elapsedTime
    });


    // localStorageに保存
    localStorage.setItem(
        "studyRecords",
        JSON.stringify(records)
    );

    // 記録を画面に表示
    displayRecords(records);

    // 今日の学習時間を更新
    displayTodayTime(records);

    // 科目別の学習時間を更新
    displaySubjectRecords(records);

});


// 記録を画面に表示する関数
function displayRecords(records) {

    recordList.innerHTML = "";

    const groupedRecords = {}; //日付＝その日の記録　という関係を構築




    records.forEach(function(record) {

     //データを日付ごとに整理する
    if (!groupedRecords[record.date]) {
    groupedRecords[record.date] = [];
    }

    groupedRecords[record.date].push(record);//この記録の日付の箱を取り出して、その箱に今の記録をいれる


        const totalSeconds = Math.floor(record.time / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const h = String(hours).padStart(2, "0");
        const m = String(minutes).padStart(2, "0");
        const s = String(seconds).padStart(2, "0");


        const li = document.createElement("li");

        li.classList.add("record");


        li.textContent =
            `${record.date}　${record.subject}　${h}:${m}:${s}`;


        recordList.appendChild(li);

    });

    for (let date in groupedRecords) {
        const dateTitle = document.createElement("h3");
        dateTitle.textContent = "📅 " + date;
        recordList.appendChild(dateTitle);//dateTitle を recordList の中に入れる

        console.log(groupedRecords[date]);

        groupedRecords[date].forEach(function(record) {
            console.log(record);

            const li = document.createElement("li");

            li.textContent = record.subject;

            recordList.appendChild(li);

        });//その日付の箱の中に入っている記録を1個ずつ取り出す

    } //groupedRecordsの中にあるキーを1つずつ取り出して、dateという変数に入れる

}


// 今日の学習時間を表示する関数
function displayTodayTime(records) {

    // 今日の日付
    const today = new Date().toLocaleDateString("ja-JP");

    // 今日の合計時間
    let totalTime = 0;


    // 今日の記録だけを探す
    records.forEach(function(record) {

        if (record.date === today) {

            totalTime += record.time;

        }

    });


    // ミリ秒 → 秒
    const totalSeconds = Math.floor(totalTime / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;


    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    const s = String(seconds).padStart(2, "0");


    // 今日の学習時間を画面に表示
    todayTimeDisplay.textContent = `${h}:${m}:${s}`;

}


// localStorageに保存されている記録を取得
const saveRecords = JSON.parse(
    localStorage.getItem("studyRecords")
) || [];


// 保存されている記録を表示
displayRecords(saveRecords);


// 今日の学習時間を表示
displayTodayTime(saveRecords);

// 科目別の学習時間を更新
displaySubjectRecords(saveRecords);

// 科目別の勉強時間を表示する関数
function displaySubjectRecords(records) {

    // 表示内容をリセット
    subjectRecords.innerHTML = "";

    // 今日の日付
    const today = new Date().toLocaleDateString("ja-JP");

    // 科目別の時間を保存するオブジェクト
    const subjectTimes = {};

    // 今日の記録だけを集計
    records.forEach(function(record) {

        if (record.date === today) {

            // 科目がまだ登録されていない場合は0を設定
            if (!subjectTimes[record.subject]) {
                subjectTimes[record.subject] = 0;
            }

            // 勉強時間を加算
            subjectTimes[record.subject] += record.time;

        }

    });


    // 科目ごとに画面へ表示
    for (let subject in subjectTimes) {

        const totalSeconds = Math.floor(
            subjectTimes[subject] / 1000
        );

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const h = String(hours).padStart(2, "0");
        const m = String(minutes).padStart(2, "0");
        const s = String(seconds).padStart(2, "0");

        const li = document.createElement("li");

        li.textContent = `${subject}　${h}:${m}:${s}`;

        subjectRecords.appendChild(li);

    }

}

// 保存されている記録を表示
displayRecords(saveRecords);

// 今日の学習時間を表示
displayTodayTime(saveRecords);

// 科目別の学習時間を表示
displaySubjectRecords(saveRecords);