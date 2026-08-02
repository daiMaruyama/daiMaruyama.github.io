const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const traceKey = "daiPortfolioTraceV4";
const sessionKey = "daiPortfolioVisitedV4";
const traceLimit = 999999;

const clampTrace = (value) => {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number)
        ? Math.min(traceLimit, Math.max(0, number))
        : 0;
};

const readTrace = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(traceKey) || "{}");
        return {
            visits: clampTrace(stored?.visits),
            touches: clampTrace(stored?.touches),
        };
    } catch {
        return { visits: 0, touches: 0 };
    }
};

let trace = readTrace();

const saveTrace = () => {
    try {
        localStorage.setItem(traceKey, JSON.stringify(trace));
    } catch {
        // The site remains usable when storage is unavailable.
    }
};

const traceNodes = {
    visits: document.querySelector("[data-trace-visits]"),
    touches: document.querySelector("[data-trace-touches]"),
    fill: document.querySelector("[data-trace-fill]"),
};

const renderTrace = () => {
    if (traceNodes.visits) {
        traceNodes.visits.textContent = trace.visits.toLocaleString("ja-JP");
    }

    if (traceNodes.touches) {
        traceNodes.touches.textContent = trace.touches.toLocaleString("ja-JP");
    }

    if (traceNodes.fill) {
        const activity = trace.visits * 4 + trace.touches;
        const progress = activity === 0 ? 4 : Math.min(100, 8 + Math.log2(activity + 1) * 11);
        traceNodes.fill.style.width = `${progress}%`;
    }
};

try {
    if (!sessionStorage.getItem(sessionKey)) {
        trace.visits = clampTrace(trace.visits + 1);
        sessionStorage.setItem(sessionKey, "1");
        saveTrace();
    }
} catch {
    // A visit is simply not persisted when storage is unavailable.
}

renderTrace();

const revealTargets = document.querySelectorAll("[data-reveal]");

if (motionQuery.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
} else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: "0px 0px -7% 0px",
        threshold: 0.1,
    });

    revealTargets.forEach((element) => revealObserver.observe(element));
}

/* トップの短いプレイ動画は、画面に近づいてから読み込む。
   data-video-src が空なら静止画のままで、不要な404も発生しない。 */
const projectVideos = [...document.querySelectorAll("[data-project-video]")];

const loadProjectVideo = (video) => {
    const source = video.dataset.videoSrc?.trim();
    if (!source || video.dataset.loaded === "true") {
        return;
    }

    video.dataset.loaded = "true";
    video.src = source;
    video.addEventListener("canplay", () => {
        video.classList.add("is-ready");
        if (!motionQuery.matches) {
            video.play().catch(() => {
                // Autoplayが拒否された場合もposter画像は残る。
            });
        }
    }, { once: true });
    video.load();
};

if (!motionQuery.matches && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            loadProjectVideo(entry.target);
            videoObserver.unobserve(entry.target);
        });
    }, {
        rootMargin: "240px 0px",
        threshold: 0.01,
    });

    projectVideos.forEach((video) => videoObserver.observe(video));
}

const inkColors = ["#ff4d62", "#e8f35a", "#f4f4f1"];

const createInkPop = (event) => {
    if (motionQuery.matches) {
        return;
    }

    const ink = document.createElement("span");
    const size = 25 + Math.random() * 18;
    const x = event.clientX;
    const y = event.clientY;

    ink.className = "home-ink-pop";
    ink.style.setProperty("--ink-color", inkColors[Math.floor(Math.random() * inkColors.length)]);
    ink.style.setProperty("--ink-size", `${size}px`);
    ink.style.setProperty("--ink-rotate", `${Math.round(Math.random() * 60 - 30)}deg`);
    ink.style.left = `${x}px`;
    ink.style.top = `${y}px`;
    document.body.appendChild(ink);
    window.setTimeout(() => ink.remove(), 680);
};

/* 演出はページのどこを押しても出す。カウントは実際の操作（リンク・ボタン）だけ。 */
document.addEventListener("pointerdown", (event) => {
    createInkPop(event);

    const target = event.target.closest("a, button");
    if (target && !target.closest("[data-no-trace]")) {
        trace.touches = clampTrace(trace.touches + 1);
        saveTrace();
        renderTrace();
    }
});

window.addEventListener("storage", (event) => {
    if (event.key !== traceKey) {
        return;
    }

    trace = readTrace();
    renderTrace();
});

/* カーソル追従リング。マウス環境のみ。
   押せる要素の上で拡大するので、クリック可能かどうかの手掛かりになる。
   OSのカーソルは消さない（消すと逆に操作しづらくなるため）。 */
if (!motionQuery.matches && window.matchMedia("(pointer: fine)").matches) {
    const ring = document.createElement("div");
    ring.className = "home-cursor";
    ring.setAttribute("aria-hidden", "true");
    document.body.append(ring);

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    document.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        ring.classList.add("is-awake");
        ring.classList.toggle("is-active", Boolean(event.target.closest("a, button, input, label, summary")));
    });

    document.addEventListener("pointerdown", () => ring.classList.add("is-pressed"));
    document.addEventListener("pointerup", () => ring.classList.remove("is-pressed"));
    document.addEventListener("pointerleave", () => ring.classList.remove("is-awake"));

    const followPointer = () => {
        ringX += (pointerX - ringX) * 0.18;
        ringY += (pointerY - ringY) * 0.18;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        window.requestAnimationFrame(followPointer);
    };

    window.requestAnimationFrame(followPointer);
}

const navigationLinks = [...document.querySelectorAll(".home-nav a[href^='#']")];
const navigationSections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

if ("IntersectionObserver" in window && navigationSections.length) {
    const navigationObserver = new IntersectionObserver((entries) => {
        const visibleSection = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleSection) {
            return;
        }

        navigationLinks.forEach((link) => {
            const isCurrent = link.getAttribute("href") === `#${visibleSection.target.id}`;
            link.classList.toggle("is-current", isCurrent);
            if (isCurrent) {
                link.setAttribute("aria-current", "true");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }, {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.2, 0.5],
    });

    navigationSections.forEach((section) => navigationObserver.observe(section));
}

/* 問い合わせフォーム。Web3Forms へ fetch で送るのでページ遷移しない。
   access_key が未設定のうちは送信せず、その旨だけ出す。 */
const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
    const status = contactForm.querySelector("[data-form-status]");
    const submitButton = contactForm.querySelector("button[type=submit]");

    const setStatus = (message, isError = false) => {
        if (!status) {
            return;
        }
        status.textContent = message;
        status.classList.toggle("is-error", isError);
    };

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!contactForm.reportValidity()) {
            return;
        }

        const key = contactForm.elements.access_key?.value;
        if (!key || key === "YOUR_ACCESS_KEY") {
            setStatus("送信先が未設定です（access_key を差し替えてください）。", true);
            return;
        }

        submitButton.disabled = true;
        setStatus("送信中…");

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { Accept: "application/json" },
                body: new FormData(contactForm),
            });
            const result = await response.json();

            if (result.success) {
                contactForm.reset();
                setStatus("送信が完了しました。ありがとうございます。");
            } else {
                setStatus("送信に失敗しました。GitHubからご連絡ください。", true);
            }
        } catch {
            setStatus("送信に失敗しました。通信環境をご確認ください。", true);
        } finally {
            submitButton.disabled = false;
        }
    });
}
