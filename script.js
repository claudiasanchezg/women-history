//--------------------------------------------------
// 1. MAPA
//--------------------------------------------------

const map = L.map("map").setView([40.4168, -3.7038], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

//--------------------------------------------------
// 2. VARIABLES GLOBALES
//--------------------------------------------------

let womenData = [];
let markersLayer = L.layerGroup().addTo(map);

let currentWoman = null;
let currentSlideIndex = 0;
let currentQuiz = null;

// Elementos interfaz
const listEl = document.getElementById("list");
const filtersEl = document.getElementById("filters");

// Modal historia
const modalEl = document.getElementById("modal");
const closeModalBtn = document.getElementById("closeModal");
const modalNameEl = document.getElementById("modalName");
const modalMetaEl = document.getElementById("modalMeta");
const carouselSlidesEl = document.getElementById("carouselSlides");
const carouselDotsEl = document.getElementById("carouselDots");
const prevSlideBtn = document.getElementById("prevSlide");
const nextSlideBtn = document.getElementById("nextSlide");

// Zona de quiz dentro del modal
const womanQuizEl = document.getElementById("womanQuiz");
const womanQuizContentEl = document.getElementById("womanQuizContent");
const womanQuizCheckBtn = document.getElementById("womanQuizCheck");
const womanQuizResultEl = document.getElementById("womanQuizResult");

// Sonido de éxito
const successSound = document.getElementById("successSound");

//--------------------------------------------------
// 3. CARGAR DATOS
//--------------------------------------------------

fetch("women.json")
  .then(res => res.json())
  .then(data => {
    womenData = data;
    // renderFilters(womenData); // filtros desactivados por ahora
    renderList(womenData);
    renderMarkers(womenData);
  })
  .catch(err => console.error("Error cargando women.json:", err));

//--------------------------------------------------
// 4. LISTA Y MARCADORES
//--------------------------------------------------

function renderMarkers(women) {
  markersLayer.clearLayers();

  women.forEach(w => {
    if (!w.coords) return;
    const marker = L.marker(w.coords).addTo(markersLayer);
    marker.on("click", () => openModal(w));
  });
}

function renderList(women) {
  listEl.innerHTML = "";

  women.forEach(w => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${w.name}</h3>
      <div>${w.city} · ${w.category}</div>
      <p>${w.bio}</p>
    `;
    card.onclick = () => openModal(w);
    listEl.appendChild(card);
  });
}

//--------------------------------------------------
// 5. FILTROS (no usados ahora, pero listos)
//--------------------------------------------------

function renderFilters(women) {
  filtersEl.innerHTML = "";

  const categories = ["Todas", ...new Set(women.map(w => w.category))];

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;

    btn.onclick = () => {
      const filtered =
        cat === "Todas"
          ? womenData
          : womenData.filter(w => w.category === cat);

      renderMarkers(filtered);
      renderList(filtered);
    };

    filtersEl.appendChild(btn);
  });
}

//--------------------------------------------------
// 6. MODAL + CARRUSEL
//--------------------------------------------------

function openModal(woman) {
  currentWoman = woman;
  currentSlideIndex = 0;
  currentQuiz = woman.quiz || null;

  modalNameEl.textContent = woman.name;
  const years =
    woman.born && woman.died ? `${woman.born}–${woman.died}` : woman.born || "";
  modalMetaEl.textContent = `${woman.city} · ${woman.category}${
    years ? " · " + years : ""
  }`;

  buildCarousel(woman.slides || []);

  // reset quiz cada vez que abrimos
  womanQuizEl.classList.add("hidden");
  womanQuizContentEl.innerHTML = "";
  womanQuizResultEl.textContent = "";

  modalEl.classList.remove("hidden");
}

//--------------------------------------------------
// CARRUSEL
//--------------------------------------------------

function buildCarousel(slides) {
  carouselSlidesEl.innerHTML = "";
  carouselDotsEl.innerHTML = "";

  slides.forEach((slide, index) => {
    const slideEl = document.createElement("div");
    slideEl.className = "carousel-slide";
    if (index === 0) slideEl.classList.add("active");

    slideEl.innerHTML = `
      ${slide.image ? `<img src="${slide.image}" class="carousel-img" />` : ""}
      <div class="carousel-title">${slide.title}</div>
      <div class="carousel-text">${slide.text}</div>
    `;

    carouselSlidesEl.appendChild(slideEl);

    const dot = document.createElement("div");
    dot.className = "carousel-dot";
    if (index === 0) dot.classList.add("active");
    dot.onclick = () => goToSlide(index);
    carouselDotsEl.appendChild(dot);
  });
}

function goToSlide(index) {
  const slides = carouselSlidesEl.querySelectorAll(".carousel-slide");
  const dots = carouselDotsEl.querySelectorAll(".carousel-dot");
  const total = slides.length;

  if (total === 0) return;

  currentSlideIndex = (index + total) % total;

  slides.forEach((s, i) => {
    s.classList.toggle("active", i === currentSlideIndex);
  });

  dots.forEach((d, i) => {
    d.classList.toggle("active", i === currentSlideIndex);
  });

  // si estamos en el último slide y hay quiz, lo mostramos
  if (currentQuiz && currentSlideIndex === total - 1) {
    renderWomanQuiz(currentQuiz);
    womanQuizEl.classList.remove("hidden");
  }
}

prevSlideBtn.onclick = () => goToSlide(currentSlideIndex - 1);
nextSlideBtn.onclick = () => goToSlide(currentSlideIndex + 1);

// Cerrar modal de mujer
closeModalBtn.onclick = () => {
  modalEl.classList.add("hidden");
};

//--------------------------------------------------
// 7. QUIZ SENCILLO DENTRO DEL MODAL (por mujer)
//--------------------------------------------------

function renderWomanQuiz(quiz) {
  womanQuizContentEl.innerHTML = "";
  womanQuizResultEl.textContent = "";

  quiz.forEach((q, qi) => {
    const block = document.createElement("div");
    block.className = "quiz-block";

    const qEl = document.createElement("p");
    qEl.className = "quiz-question";
    qEl.textContent = q.question;

    const optsWrapper = document.createElement("div");
    optsWrapper.className = "quiz-options";

    q.options.forEach((opt, oi) => {
      const label = document.createElement("label");
      label.className = "quiz-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `quiz-q${qi}`;
      input.value = oi.toString();

      const span = document.createElement("span");
      span.textContent = opt;

      label.appendChild(input);
      label.appendChild(span);
      optsWrapper.appendChild(label);
    });

    block.appendChild(qEl);
    block.appendChild(optsWrapper);
    womanQuizContentEl.appendChild(block);
  });

  womanQuizCheckBtn.onclick = () => {
    let correct = 0;

    quiz.forEach((q, qi) => {
      const selected = document.querySelector(
        `input[name="quiz-q${qi}"]:checked`
      );
      if (!selected) return;
      const chosenIndex = parseInt(selected.value, 10);
      if (chosenIndex === q.answer) correct++;
    });

    if (correct === quiz.length) {
      womanQuizResultEl.innerHTML = `
        <div class="quiz-success">
          <span class="quiz-success-icon">★</span>
          <span>¡Perfecto! Has acertado todas.</span>
        </div>
      `;

      if (successSound) {
        successSound.currentTime = 0;
        successSound.play().catch(() => {});
      }
    } else {
      womanQuizResultEl.textContent =
        "Has fallado alguna… puedes volver a intentarlo.";
    }
  };
}

//--------------------------------------------------
// 8. QUIZ "DESCUBRE TU REFERENTE"
//--------------------------------------------------

const personalityQuiz = [
  {
    question: "¿Qué tipo de lucha te representa más?",
    options: [
      {
        text: "Plantarse frente a una injusticia aunque dé miedo",
        weights: { "Ana Orantes Ruiz": 2, "Josefa": 2, "Mariana Pineda": 2 }
      },
      {
        text: "Montar tu propio negocio y cambiar las cosas desde ahí",
        weights: { "Victorina Cantó": 2, "Maria Plaza i Montaner": 2 }
      },
      {
        text: "Crear arte que haga pensar y sentir",
        weights: { "Remedios Varo": 2, "Matilde Salvador i Segarra": 2 }
      }
    ]
  },
  {
    question: "¿En qué contexto sientes más conexión?",
    options: [
      {
        text: "Dictadura y franquismo, resistir cuando casi todo está en contra",
        weights: {
          "Ana Orantes Ruiz": 1,
          "Victorina Cantó": 1,
          "Josefa": 1,
          "Maria Plaza i Montaner": 1,
          "Matilde Salvador i Segarra": 1
        }
      },
      {
        text: "Tiempos de guerra y exilio",
        weights: { "Mariana Pineda": 1, "Remedios Varo": 1 }
      },
      {
        text: "Presente y futuro tecnológico",
        weights: { "Nerea Luis": 2 }
      }
    ]
  },
  {
    question: "¿Qué te describe mejor?",
    options: [
      {
        text: "Soy de hablar claro y romper silencios incómodos",
        weights: { "Ana Orantes Ruiz": 2, "Josefa": 1 }
      },
      {
        text: "Me muevo bien entre números, ciencia y tecnología",
        weights: { "Nerea Luis": 2, "Remedios Varo": 1 }
      },
      {
        text: "Prefiero transformar desde la vida cotidiana del barrio",
        weights: { "Maria Plaza i Montaner": 2, "Victorina Cantó": 1 }
      }
    ]
  }
];

const startQuizBtn = document.getElementById("startQuiz");
const quizModalEl = document.getElementById("quizModal");
const quizStepEl = document.getElementById("quizStep");
const closeQuizBtn = document.getElementById("closeQuiz");

startQuizBtn.onclick = () => openPersonalityQuiz();
closeQuizBtn.onclick = () => quizModalEl.classList.add("hidden");

// Quiz paso a paso, una pregunta cada vez
function openPersonalityQuiz() {
  let currentPQIndex = 0;
  const answers = [];

  function renderStep() {
    quizStepEl.innerHTML = "";

    const q = personalityQuiz[currentPQIndex];

    const title = document.createElement("h2");
    title.textContent = "Quiz";
    quizStepEl.appendChild(title);

    const qEl = document.createElement("p");
    qEl.className = "quiz-question";
    qEl.textContent = q.question;
    quizStepEl.appendChild(qEl);

    q.options.forEach((opt, oi) => {
      const label = document.createElement("label");
      label.className = "quiz-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `p-quiz-q${currentPQIndex}`;
      input.value = oi.toString();

      const span = document.createElement("span");
      span.textContent = opt.text;

      label.appendChild(input);
      label.appendChild(span);
      quizStepEl.appendChild(label);
    });

    const btnWrapper = document.createElement("div");
    btnWrapper.style.marginTop = "1.5rem";
    btnWrapper.style.display = "flex";
    btnWrapper.style.justifyContent = "space-between";
    quizStepEl.appendChild(btnWrapper);

    const backBtn = document.createElement("button");
    backBtn.textContent = "Atrás";
    backBtn.className = "secondary-btn";
    backBtn.disabled = currentPQIndex === 0;
    backBtn.onclick = () => {
      if (currentPQIndex > 0) {
        currentPQIndex--;
        renderStep();
      }
    };
    btnWrapper.appendChild(backBtn);

    const nextBtn = document.createElement("button");
    nextBtn.textContent =
      currentPQIndex === personalityQuiz.length - 1
        ? "Ver mi referente"
        : "Siguiente";
    nextBtn.className = "primary-btn";
    nextBtn.onclick = () => {
      const selected = document.querySelector(
        `input[name="p-quiz-q${currentPQIndex}"]:checked`
      );
      if (!selected) return;

      answers[currentPQIndex] = parseInt(selected.value, 10);

      if (currentPQIndex === personalityQuiz.length - 1) {
        const best = computeBestMatch(answers);
        if (best) {
          quizModalEl.classList.add("hidden");
          openModal(best);
        }
      } else {
        currentPQIndex++;
        renderStep();
      }
    };
    btnWrapper.appendChild(nextBtn);
  }

  quizModalEl.classList.remove("hidden");
  renderStep();
}

// Calcula la mujer que mejor encaja con las respuestas
function computeBestMatch(answers) {
  const scores = {}; // { "Nombre": puntos }

  answers.forEach((optIndex, qIndex) => {
    if (optIndex == null) return;
    const option = personalityQuiz[qIndex].options[optIndex];
    Object.entries(option.weights).forEach(([name, weight]) => {
      scores[name] = (scores[name] || 0) + weight;
    });
  });

  let bestName = null;
  let bestScore = -Infinity;
  Object.entries(scores).forEach(([name, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  });

  if (!bestName) return null;
  return womenData.find(w => w.name === bestName) || null;
}
