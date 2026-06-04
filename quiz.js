// ==========================================================================
// QUIZ SYSTEM LOGIC - HỆ THỐNG XỬ LÝ TRẮC NGHIỆM
// ==========================================================================

// --- KHAI BÁO BIẾN TRẠNG THÁI (STATE VARIABLES) ---
let questions = [];            // Danh sách câu hỏi gốc sau khi parse
let quizQuestions = [];        // Danh sách câu hỏi đang làm (có thể đã đảo thứ tự)
let userAnswers = {};          // Lưu đáp án đã chọn: { originalNumber: selectedOptionText }
let flaggedQuestions = new Set(); // Danh sách câu hỏi đã đánh dấu (originalNumber)
let currentIndex = 0;          // Chỉ số câu hỏi hiện tại trong quizQuestions
let startTime = null;          // Thời gian bắt đầu làm bài
let timerInterval = null;      // ID của bộ đếm thời gian
let selectedFilter = 'all';    // Bộ lọc hiển thị câu hỏi ở màn hình kết quả

// --- MẪU BỘ CÂU HỎI MẪU ---
const SAMPLE_QUESTIONS = `Câu 1. Theo luật bảo vệ môi trường Việt Nam, điều 1 quy định môi trường như thế nào ?
$A.Môi trường bao gồm các yếu tố vật chất tự nhiên và nhân tạo quan hệ mật thiết với nhau, bao quanh con người, có ảnh hưởng đến đời sống, kinh tế, xã hội, sự tồn tại, phát triển của con người, sinh vật và tự nhiên
B.Môi trường bao gồm tất cả các yếu tố tồn tại xung quanh con người, có tác động đến sinh trưởng và phát triển của con người
C.Môi trường bao gồm các yếu tố tự nhiên, kinh tế, xã hội quyết định đến sự phát triển của con người và thiên nhiên
D.Môi trường bao gồm các yếu tố tự nhiên và yếu tố vật chất nhân tạo quan hệ mật thiết với nhau, bao quanh con người, có ảnh hưởng tới đời sống, sản xuất, sự tồn tại, phát triển của con người và thiên nhiên

Câu 2. Biện pháp nào sau đây thúc đẩy tiêu dùng bền vững ?
A.Sản xuất hàng hóa dùng một lần
B.Gắn nhãn sinh thái và giáo dục người tiêu dùng
$C.Tăng sản phẩm đóng gói nhựa tiện lợi
D.Khuyến mãi mua nhiều tặng nhiều

Câu 3. Giao thức nào hoạt động ở tầng truyền dẫn (Transport Layer) của mô hình TCP/IP?
$A. TCP và UDP
B. IP và ICMP
C. HTTP và FTP
D. ARP và RARP

Câu 4. Trong dịch vụ FTP, chế độ Active (Chủ động) sử dụng cổng nào để truyền dữ liệu?
A. Cổng 80
B. Cổng 21
$C. Cổng 20
D. Cổng 443

Câu 5. Mục tiêu cốt lõi của phát triển bền vững là gì?
A. Chỉ phát triển kinh tế nhanh nhất có thể
B. Bảo vệ môi trường tuyệt đối và không phát triển kinh tế
$C. Đáp ứng nhu cầu hiện tại mà không làm tổn hại đến khả năng đáp ứng nhu cầu của các thế hệ tương lai
D. Khai thác tối đa tài nguyên thiên nhiên để phục vụ công nghiệp`;

// --- DOM ELEMENTS ---
const themeToggleBtn = document.getElementById('theme-toggle');
const setupView = document.getElementById('setup-view');
const quizView = document.getElementById('quiz-view');
const resultsView = document.getElementById('results-view');

const questionsInput = document.getElementById('questions-input');
const loadSampleBtn = document.getElementById('load-sample-btn');
const loadFileQuizBtn = document.getElementById('load-file-quiz-btn');
const uploadFileBtn = document.getElementById('upload-file-btn');
const fileInputUploader = document.getElementById('file-input-uploader');
const startQuizBtn = document.getElementById('start-quiz-btn');
const shuffleQuestionsCheckbox = document.getElementById('shuffle-questions');
const shuffleOptionsCheckbox = document.getElementById('shuffle-options');

const candidateNameInput = document.getElementById('candidate-name');
const candidateIdInput = document.getElementById('candidate-id');
const displayStudentName = document.getElementById('display-student-name');
const displayStudentId = document.getElementById('display-student-id');

const quizTimer = document.getElementById('quiz-timer');
const questionsGrid = document.getElementById('questions-grid');
const answeredCountBadge = document.getElementById('answered-count-badge');
// Đã loại bỏ các DOM Element của thanh tiến trình (progress-bar) theo yêu cầu

const questionLabel = document.getElementById('question-label');
const flagBtn = document.getElementById('flag-btn');
const questionText = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices-container');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitQuizBtn = document.getElementById('submit-quiz-btn');
const backToSetupBtn = document.getElementById('back-to-setup-btn');

// Results elements
const finalScore = document.getElementById('final-score');
const scoreCircle = document.getElementById('score-circle');
const resultCandidateName = document.getElementById('result-candidate-name');
const resultCandidateId = document.getElementById('result-candidate-id');
const correctCountEl = document.getElementById('correct-count');
const incorrectCountEl = document.getElementById('incorrect-count');
const skippedCountEl = document.getElementById('skipped-count');
const timeSpentEl = document.getElementById('time-spent');
const reviewList = document.getElementById('review-list');

const filterAllCnt = document.getElementById('filter-all-cnt');
const filterCorrectCnt = document.getElementById('filter-correct-cnt');
const filterIncorrectCnt = document.getElementById('filter-incorrect-cnt');
const filterSkippedCnt = document.getElementById('filter-skipped-cnt');

const restartQuizBtn = document.getElementById('restart-quiz-btn');
const newQuizBtn = document.getElementById('new-quiz-btn');

// --- THEME TOGGLE LOGIC ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// --- PARSER LOGIC ---
function parseQuestions(text) {
    const lines = text.split(/\r?\n/);
    const parsed = [];
    let currentQuestion = null;
    
    // Regex nhận diện phương án chọn: ví dụ "A.", "B)", "$C.", "$ D)", "$A.Nội dung"
    const optionRegex = /^[ \t]*(\$?)[ \t]*([A-Z])\s*[\.\)]\s*(.*)$/;
    // Regex nhận diện câu hỏi mới: ví dụ "Câu 1. ", "Câu 23: ", "câu 2 "
    const questionRegex = /^[ \t]*câu\s+(\d+)\s*[\.\:]?\s*(.*)$/i;
    
    for (let line of lines) {
        // Giữ lại nội dung thô để kiểm tra, trim khoảng trống đầu cuối line
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        const optionMatch = line.match(optionRegex);
        if (optionMatch) {
            if (currentQuestion) {
                const isCorrect = optionMatch[1] === '$';
                const label = optionMatch[2];
                const content = optionMatch[3].trim();
                currentQuestion.options.push({
                    label: label,
                    text: content,
                    isCorrect: isCorrect
                });
            }
            continue;
        }
        
        const questionMatch = line.match(questionRegex);
        if (questionMatch) {
            if (currentQuestion && currentQuestion.options.length > 0) {
                parsed.push(currentQuestion);
            }
            currentQuestion = {
                originalNumber: parseInt(questionMatch[1], 10),
                text: questionMatch[2].trim(),
                options: []
            };
            continue;
        }
        
        // Nếu dòng không khớp câu hỏi hay phương án, xem như là text bổ sung của câu hỏi hoặc phương án trước đó
        if (currentQuestion) {
            if (currentQuestion.options.length === 0) {
                // Thêm dòng mới vào mô tả câu hỏi
                currentQuestion.text += '\n' + trimmedLine;
            } else {
                // Thêm dòng mới vào mô tả phương án cuối cùng
                const lastOption = currentQuestion.options[currentQuestion.options.length - 1];
                lastOption.text += '\n' + trimmedLine;
            }
        }
    }
    
    // Push câu hỏi cuối cùng nếu hợp lệ
    if (currentQuestion && currentQuestion.options.length > 0) {
        parsed.push(currentQuestion);
    }
    
    return parsed;
}

// --- SHUFFLE LOGIC (FISHER-YATES SHUFFLE) ---
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// --- TIMER FUNCTION ---
function startTimer() {
    startTime = Date.now();
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimerDisplay() {
    const elapsedMs = Date.now() - startTime;
    const totalSecs = Math.floor(elapsedMs / 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    
    const formatted = [
        hours.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
    ].join(':');
    
    quizTimer.textContent = formatted;
}

// --- QUIZ VIEW CONTROL & RENDER ---
function switchView(viewName) {
    setupView.classList.remove('active');
    quizView.classList.remove('active');
    resultsView.classList.remove('active');
    
    if (viewName === 'setup') setupView.classList.add('active');
    if (viewName === 'quiz') quizView.classList.add('active');
    if (viewName === 'results') resultsView.classList.add('active');
}

function initQuiz() {
    const text = questionsInput.value.trim();
    if (!text) {
        alert('Vui lòng nhập danh sách câu hỏi trước!');
        return;
    }
    
    questions = parseQuestions(text);
    if (questions.length === 0) {
        alert('Không tìm thấy câu hỏi hợp lệ! Vui lòng kiểm tra lại định dạng câu hỏi (Ví dụ bắt đầu bằng "Câu 1." và các đáp án "A.", "B."...).');
        return;
    }
    
    // Gán thông tin thí sinh
    displayStudentName.textContent = candidateNameInput.value.trim() || 'Thí sinh ẩn danh';
    displayStudentId.textContent = candidateIdInput.value.trim() || 'Không có thông tin';
    
    // Reset trạng thái làm bài
    userAnswers = {};
    flaggedQuestions.clear();
    currentIndex = 0;
    
    // Tạo bản sao danh sách câu hỏi để xáo trộn
    quizQuestions = JSON.parse(JSON.stringify(questions));
    
    // Đảo câu hỏi nếu chọn
    if (shuffleQuestionsCheckbox.checked) {
        shuffle(quizQuestions);
    }
    
    // Đảo đáp án của từng câu hỏi nếu chọn
    if (shuffleOptionsCheckbox.checked) {
        quizQuestions.forEach(q => {
            shuffle(q.options);
        });
    }
    
    // Áp dụng giới hạn số lượng câu hỏi làm bài
    const limitVal = document.getElementById('question-limit').value;
    if (limitVal !== 'all') {
        const limit = parseInt(limitVal, 10);
        if (quizQuestions.length > limit) {
            quizQuestions = quizQuestions.slice(0, limit);
        }
    }
    
    // Render sidebar lưới câu hỏi
    renderQuestionsGrid();
    
    // Render câu hỏi đầu tiên
    showQuestion(0);
    
    // Bắt đầu tính giờ
    startTimer();
    
    // Chuyển view
    switchView('quiz');
}

// Render lưới ô số bên sidebar trái
function renderQuestionsGrid() {
    questionsGrid.innerHTML = '';
    
    // Tạo lưới ô số từ 1 đến hết tổng số câu hỏi theo đúng thứ tự hiển thị của quizQuestions
    quizQuestions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'grid-btn';
        btn.id = `grid-btn-${idx}`;
        btn.textContent = idx + 1; // Hiển thị 1, 2, 3...
        
        btn.addEventListener('click', () => {
            showQuestion(idx); // Bấm vào ô số nào nhảy trực tiếp đến index đó
        });
        
        questionsGrid.appendChild(btn);
    });
    
    updateSidebarGridStates();
}

// Cập nhật trạng thái màu sắc các ô trong grid
function updateSidebarGridStates() {
    let answeredCount = 0;
    
    quizQuestions.forEach((q, idx) => {
        const btn = document.getElementById(`grid-btn-${idx}`);
        if (!btn) return;
        
        btn.classList.remove('current', 'answered', 'flagged');
        
        // 1. Kiểm tra xem có phải câu đang hiển thị không
        if (currentIndex === idx) {
            btn.classList.add('current');
        }
        
        // 2. Kiểm tra xem đã trả lời chưa
        if (userAnswers[idx] !== undefined) {
            btn.classList.add('answered');
            answeredCount++;
        }
        
        // 3. Kiểm tra xem có đánh dấu không
        if (flaggedQuestions.has(idx)) {
            btn.classList.add('flagged');
        }
    });
    
    // Cập nhật badge số câu đã làm
    answeredCountBadge.textContent = `${answeredCount}/${quizQuestions.length}`;
}

// Hiển thị nội dung câu hỏi tại index cụ thể trong danh sách làm bài (quizQuestions)
function showQuestion(index) {
    if (index < 0 || index >= quizQuestions.length) return;
    
    currentIndex = index;
    const q = quizQuestions[currentIndex];
    
    // 1. Cập nhật nhãn tiêu đề (Sử dụng số thứ tự hiển thị tuần tự Câu 1, Câu 2...)
    questionLabel.textContent = `Câu ${currentIndex + 1}`;
    
    // 2. Cập nhật trạng thái nút Flag (Đánh dấu) bằng index
    if (flaggedQuestions.has(index)) {
        flagBtn.classList.add('active');
        flagBtn.querySelector('span').textContent = 'Đã đánh dấu xem lại';
    } else {
        flagBtn.classList.remove('active');
        flagBtn.querySelector('span').textContent = 'Đánh dấu câu hỏi';
    }
    
    // 3. Hiển thị nội dung câu hỏi
    questionText.textContent = q.text;
    
    // 4. Render các phương án lựa chọn
    choicesContainer.innerHTML = '';
    const selectedAnswerText = userAnswers[index];
    
    q.options.forEach((opt, optIdx) => {
        const isSelected = selectedAnswerText === opt.text;
        
        const optionEl = document.createElement('div');
        optionEl.className = `choice-option ${isSelected ? 'selected' : ''}`;
        
        optionEl.innerHTML = `
            <div class="choice-radio-circle">
                <div class="choice-radio-dot"></div>
            </div>
            <div class="choice-label-badge">${String.fromCharCode(65 + optIdx)}</div>
            <div class="choice-text">${opt.text}</div>
        `;
        
        optionEl.addEventListener('click', () => {
            selectAnswer(index, opt.text);
        });
        
        choicesContainer.appendChild(optionEl);
    });
    
    // 5. Trạng thái các nút điều hướng Prev/Next
    prevBtn.disabled = currentIndex === 0;
    
    if (currentIndex === quizQuestions.length - 1) {
        nextBtn.innerHTML = `Hoàn thành bài thi <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"></path><path d="M5 12h.01"></path><path d="M19 12h.01"></path><circle cx="12" cy="12" r="10"></circle></svg>`;
        nextBtn.classList.add('btn-accent');
    } else {
        nextBtn.innerHTML = `Câu tiếp theo <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>`;
        nextBtn.classList.remove('btn-accent');
    }
    
    // Cập nhật trạng thái hiển thị của lưới sidebar
    updateSidebarGridStates();
}

// Xử lý chọn đáp án
function selectAnswer(index, optionText) {
    // Lưu lựa chọn của người dùng vào state dựa trên index trong quiz
    userAnswers[index] = optionText;
    
    // Render lại câu hỏi hiện tại để đổi class css của phương án được chọn
    showQuestion(currentIndex);
}

// Xử lý nút Đánh dấu xem lại
flagBtn.addEventListener('click', () => {
    if (flaggedQuestions.has(currentIndex)) {
        flaggedQuestions.delete(currentIndex);
    } else {
        flaggedQuestions.add(currentIndex);
    }
    showQuestion(currentIndex);
});

// Điều hướng Câu trước/sau
prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        showQuestion(currentIndex - 1);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < quizQuestions.length - 1) {
        showQuestion(currentIndex + 1);
    } else {
        // Đang ở câu cuối, nút Next đổi chức năng thành Nộp bài
        triggerSubmitQuiz();
    }
});

// --- CHẤM ĐIỂM & NỘP BÀI (SUBMIT & SCORE LOGIC) ---
function triggerSubmitQuiz() {
    const unansweredCount = quizQuestions.length - Object.keys(userAnswers).length;
    let confirmMsg = 'Bạn có chắc chắn muốn nộp bài thi không?';
    if (unansweredCount > 0) {
        confirmMsg = `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn vẫn muốn nộp bài thi chứ?`;
    }
    
    if (confirm(confirmMsg)) {
        submitQuiz();
    }
}

submitQuizBtn.addEventListener('click', triggerSubmitQuiz);

function submitQuiz() {
    stopTimer();
    
    // Tính toán kết quả
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    
    quizQuestions.forEach((q, idx) => {
        const userAnswerText = userAnswers[idx];
        const correctOpt = q.options.find(o => o.isCorrect);
        
        if (userAnswerText === undefined) {
            skippedCount++;
        } else if (correctOpt && userAnswerText === correctOpt.text) {
            correctCount++;
        } else {
            incorrectCount++;
        }
    });
    
    const score = quizQuestions.length > 0 ? (correctCount / quizQuestions.length) * 10 : 0;
    const formattedScore = score.toFixed(1);
    
    // Hiển thị điểm số lên UI
    finalScore.textContent = formattedScore;
    
    // Cập nhật vòng tròn tiến trình điểm
    const percent = Math.round(score * 10); // Lệ thuộc thang điểm 10 quy về 100%
    scoreCircle.setAttribute('stroke-dasharray', `${percent}, 100`);
    
    // Đổi màu sắc stroke của vòng tròn điểm theo mức độ làm bài
    if (score >= 8.0) {
        scoreCircle.style.stroke = 'var(--accent)';
    } else if (score >= 5.0) {
        scoreCircle.style.stroke = 'var(--warning)';
    } else {
        scoreCircle.style.stroke = 'var(--danger)';
    }
    
    // Cập nhật thông tin thí sinh kết quả
    resultCandidateName.textContent = candidateNameInput.value.trim() || 'Thí sinh ẩn danh';
    resultCandidateId.textContent = candidateIdInput.value.trim() || 'Không có thông tin';
    
    // Số lượng chi tiết các câu
    correctCountEl.textContent = correctCount;
    incorrectCountEl.textContent = incorrectCount;
    skippedCountEl.textContent = skippedCount;
    timeSpentEl.textContent = quizTimer.textContent;
    
    // Cập nhật bộ lọc đếm số câu ở tab review
    filterAllCnt.textContent = quizQuestions.length;
    filterCorrectCnt.textContent = correctCount;
    filterIncorrectCnt.textContent = incorrectCount;
    filterSkippedCnt.textContent = skippedCount;
    
    // Render danh sách xem lại bài làm
    renderReviewList();
    
    // Chuyển sang màn hình kết quả
    switchView('results');
}

// Render chi tiết bài thi để người dùng review đúng/sai
function renderReviewList() {
    reviewList.innerHTML = '';
    
    // Hiển thị danh sách review theo đúng thứ tự câu hỏi làm bài (Câu 1, Câu 2...)
    quizQuestions.forEach((q, idx) => {
        const userAnswerText = userAnswers[idx];
        const correctOpt = q.options.find(o => o.isCorrect);
        const isCorrect = correctOpt && userAnswerText === correctOpt.text;
        const isSkipped = userAnswerText === undefined;
        
        // Kiểm tra bộ lọc hiện tại
        if (selectedFilter === 'correct' && !isCorrect) return;
        if (selectedFilter === 'incorrect' && (isCorrect || isSkipped)) return;
        if (selectedFilter === 'skipped' && !isSkipped) return;
        
        const card = document.createElement('div');
        let cardClass = 'review-card ';
        let statusBadge = '';
        
        if (isSkipped) {
            cardClass += 'skipped-card';
            statusBadge = '<span class="review-status-badge skipped-badge">Chưa chọn</span>';
        } else if (isCorrect) {
            cardClass += 'correct-card';
            statusBadge = '<span class="review-status-badge correct-badge">Đúng</span>';
        } else {
            cardClass += 'incorrect-card';
            statusBadge = '<span class="review-status-badge incorrect-badge">Sai</span>';
        }
        
        card.className = cardClass;
        
        let choicesHtml = '';
        q.options.forEach((opt, optIdx) => {
            let optClass = 'review-choice ';
            let optIcon = '<div class="review-choice-icon"></div>';
            
            // Highlight các phương án đúng/sai
            if (opt.isCorrect) {
                optClass += 'choice-correct-ans';
                optIcon = `
                    <div class="review-choice-icon correct-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>`;
            } else if (userAnswerText === opt.text && !opt.isCorrect) {
                optClass += 'choice-user-incorrect';
                optIcon = `
                    <div class="review-choice-icon incorrect-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>`;
            }
            
            choicesHtml += `
                <div class="${optClass}">
                    ${optIcon}
                    <span class="choice-label-badge">${String.fromCharCode(65 + optIdx)}</span>
                    <span class="choice-text">${opt.text}</span>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="review-card-header">
                <span class="question-label">Câu hỏi ${idx + 1} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted); text-transform: none;">(Câu ${q.originalNumber} gốc)</span></span>
                ${statusBadge}
            </div>
            <div class="review-question-text">${q.text}</div>
            <div class="review-choices">
                ${choicesHtml}
            </div>
        `;
        
        reviewList.appendChild(card);
    });
    
    if (reviewList.innerHTML === '') {
        reviewList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Không có câu hỏi nào khớp với bộ lọc.</div>`;
    }
}

// --- FILTER BUTTONS CLICK EVENT ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedFilter = e.currentTarget.getAttribute('data-filter');
        renderReviewList();
    });
});

// --- ACTION BUTTONS EVENTS ---
// Hàm nạp tệp quiz.txt có sẵn
function fetchQuizFile() {
    fetch('quiz.txt?t=' + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error('Không tìm thấy tệp quiz.txt trong cùng thư mục dự án.');
            }
            return response.text();
        })
        .then(data => {
            questionsInput.value = data;
        })
        .catch(error => {
            console.warn(error.message);
            // Nếu chạy trực tiếp qua giao thức file://
            if (window.location.protocol === 'file:') {
                console.log('Bảo mật trình duyệt chặn fetch trên file://. Cần sử dụng công cụ Chọn file hoặc chạy localhost.');
            }
        });
}

// Bấm nút tự động tải tệp quiz.txt
loadFileQuizBtn.addEventListener('click', () => {
    fetch('quiz.txt?t=' + Date.now())
        .then(response => {
            if (!response.ok) {
                throw new Error('Không tìm thấy tệp quiz.txt trong thư mục dự án.');
            }
            return response.text();
        })
        .then(data => {
            questionsInput.value = data;
            alert('Đã nạp thành công bộ câu hỏi từ tệp quiz.txt!');
        })
        .catch(error => {
            alert('Lỗi nạp tệp: ' + error.message + '\n\nNếu đang mở file index.html trực tiếp (file://), trình duyệt sẽ chặn tải file vì lý do bảo mật. Vui lòng bấm nút "Chọn file từ máy" để tải tệp thủ công.');
        });
});

// Bấm nút tải file tùy chọn từ máy
uploadFileBtn.addEventListener('click', () => {
    fileInputUploader.click();
});

// Sự kiện khi chọn file từ máy tính
fileInputUploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
        questionsInput.value = evt.target.result;
        alert(`Đã nạp thành công bộ câu hỏi từ tệp: ${file.name}`);
    };
    reader.onerror = () => {
        alert('Không thể đọc tệp. Vui lòng thử lại.');
    };
    reader.readAsText(file, 'UTF-8');
});

loadSampleBtn.addEventListener('click', () => {
    questionsInput.value = SAMPLE_QUESTIONS;
    alert('Đã tải bộ câu hỏi mẫu!');
});

startQuizBtn.addEventListener('click', initQuiz);

backToSetupBtn.addEventListener('click', () => {
    if (confirm('Bạn muốn thoát bài thi hiện tại và quay về màn hình thiết lập? Mọi kết quả hiện tại sẽ bị xóa.')) {
        stopTimer();
        switchView('setup');
    }
});

restartQuizBtn.addEventListener('click', () => {
    // Làm lại chính bộ câu hỏi này, giữ nguyên cấu trúc đảo
    userAnswers = {};
    flaggedQuestions.clear();
    currentIndex = 0;
    renderQuestionsGrid();
    showQuestion(0);
    startTimer();
    switchView('quiz');
});

newQuizBtn.addEventListener('click', () => {
    switchView('setup');
});

// --- INIT APP ---
initTheme();
// Tự động tải trước tệp quiz.txt nếu có sẵn khi mở trang
fetchQuizFile();
