const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* タイトル画面。旧サイトの挙動をそのまま移植。
   セッション中は初回だけ表示し、クリックまたはキー入力で消える。 */
const intro = document.getElementById("intro");

if (intro) {
    let introSeen = false;
    try {
        introSeen = sessionStorage.getItem("introSeen") === "1";
    } catch {
        // ストレージが使えない場合は毎回表示する。
    }

    if (introSeen || motionQuery.matches) {
        intro.classList.add("gone");
    } else {
        const dismissIntro = () => {
            if (intro.classList.contains("go")) {
                return;
            }

            intro.classList.add("go");
            try {
                sessionStorage.setItem("introSeen", "1");
            } catch {
                // 保存できなくても表示の切り替えは行う。
            }
            window.setTimeout(() => intro.classList.add("gone"), 700);
        };

        window.setTimeout(dismissIntro, 2200);
        intro.addEventListener("click", dismissIntro);
        intro.addEventListener("keydown", dismissIntro);
        window.addEventListener("keydown", dismissIntro, { once: true });
    }
}

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

/* 画面中央に近い作品だけ動かし、ほかのカードは静止画に戻す。 */
const projectVideos = [...document.querySelectorAll("[data-project-video]")]
    .filter(video => video.dataset.videoSrc?.trim());

if (projectVideos.length) {
    let activeVideo = null;
    let frame = 0;

    const updatePreview = () => {
        frame = 0;
        let next = null;
        let nearest = Infinity;

        if (!document.hidden && !motionQuery.matches) {
            const middle = window.innerHeight / 2;
            for (const video of projectVideos) {
                const rect = video.getBoundingClientRect();
                const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                if (!rect.height || visible < Math.min(rect.height, window.innerHeight) * .45) continue;

                const distance = Math.abs(rect.top + rect.height / 2 - middle);
                if (distance < nearest) {
                    nearest = distance;
                    next = video;
                }
            }
        }

        if (next === activeVideo) return;
        if (activeVideo) {
            activeVideo.pause();
            activeVideo.classList.remove("is-ready");
        }
        activeVideo = next;
        if (next) {
            if (!next.hasAttribute("src")) next.src = next.dataset.videoSrc;
            next.play().then(() => {
                if (activeVideo === next) next.classList.add("is-ready");
            }).catch(() => {
                // 自動再生できない環境では静止画を表示する。
            });
        }
    };

    const schedulePreview = () => {
        if (!frame) frame = window.requestAnimationFrame(updatePreview);
    };
    window.addEventListener("scroll", schedulePreview, { passive: true });
    window.addEventListener("resize", schedulePreview);
    window.addEventListener("load", schedulePreview);
    document.addEventListener("visibilitychange", updatePreview);
    motionQuery.addEventListener("change", updatePreview);
    schedulePreview();
}

const inkColors = ["#e60029", "#e8f35a", "#f4f4f1"];

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

document.addEventListener("pointerdown", createInkPop);

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
