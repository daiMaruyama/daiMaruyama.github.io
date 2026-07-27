(() => {
    const storageKey = "portfolioGardenV1";
    const visitSessionKey = "portfolioGardenVisitedV1";
    const maxValue = 999999;
    const stages = [
        { name: "SEED", min: 0, message: "最初の種が植えられました。" },
        { name: "SPROUT", min: 10, message: "小さな芽が、館内の反応を受け取っています。" },
        { name: "PATCH", min: 35, message: "鑑賞の跡が、ひとつの景色になり始めました。" },
        { name: "GARDEN", min: 90, message: "来館した人たちの操作が、中庭を育てています。" },
        { name: "BLOOM", min: 220, message: "花が咲きました。遊ばれた記録が見える形に。" },
        { name: "WILD", min: 500, message: "予定調和を越えて、庭が勝手に育ち始めました。" },
        { name: "GROVE", min: 1000, message: "たくさんの訪問が、この場所の風景になりました。" }
    ];

    const nodes = {
        lab: document.querySelector("#play-lab"),
        visits: document.querySelector("[data-garden-visits]"),
        actions: document.querySelector("[data-garden-actions]"),
        stage: document.querySelector("[data-garden-stage]"),
        message: document.querySelector("[data-garden-message]"),
        next: document.querySelector("[data-garden-next]"),
        plants: document.querySelector("[data-garden-plants]"),
        water: document.querySelector("[data-garden-water]"),
        debugToggle: document.querySelector("[data-debug-toggle]"),
        debugPanel: document.querySelector("[data-debug-panel]"),
        debugVisits: document.querySelector("[data-debug-visits]"),
        debugActions: document.querySelector("[data-debug-actions]"),
        debugApply: document.querySelector("[data-debug-apply]"),
        debugReset: document.querySelector("[data-debug-reset]")
    };

    const clamp = (value) => {
        const number = Number.parseInt(value, 10);
        return Number.isFinite(number) ? Math.min(maxValue, Math.max(0, number)) : 0;
    };

    const loadState = () => {
        try {
            const stored = JSON.parse(window.localStorage.getItem(storageKey));
            return {
                visits: clamp(stored?.visits),
                actions: clamp(stored?.actions)
            };
        } catch {
            return { visits: 0, actions: 0 };
        }
    };

    let state = loadState();

    const saveState = () => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(state));
        } catch {
            // The garden still works for this page view when storage is unavailable.
        }
    };

    const points = () => state.visits * 4 + state.actions;

    const currentStageIndex = () => {
        const total = points();
        let index = 0;
        stages.forEach((stage, stageIndex) => {
            if (total >= stage.min) index = stageIndex;
        });
        return index;
    };

    const createPlant = (index, count, flowering) => {
        const plant = document.createElement("span");
        const x = count === 1 ? 50 : 4 + ((index * 37) % 92);
        const height = 38 + ((index * 23) % 74);
        const delay = Math.min(index * 22, 420);
        const hue = (index * 47) % 160;

        plant.className = `garden-plant${flowering && index % 3 === 0 ? " has-flower" : ""}`;
        plant.style.setProperty("--x", `${x}%`);
        plant.style.setProperty("--h", `${height}px`);
        plant.style.setProperty("--delay", `${delay}ms`);
        plant.style.setProperty("--hue", `${hue}deg`);

        ["plant-stem", "plant-leaf plant-leaf--a", "plant-leaf plant-leaf--b", "plant-flower"].forEach((className) => {
            const part = document.createElement(className === "plant-flower" ? "b" : "i");
            part.className = className;
            plant.append(part);
        });
        return plant;
    };

    const render = () => {
        if (!nodes.visits || !nodes.actions || !nodes.stage) return;

        const total = points();
        const stageIndex = currentStageIndex();
        const stage = stages[stageIndex];
        const nextStage = stages[stageIndex + 1];
        const plantCount = Math.min(28, Math.max(1, 1 + Math.floor(total / 15)));

        nodes.visits.textContent = state.visits.toLocaleString("ja-JP");
        nodes.actions.textContent = state.actions.toLocaleString("ja-JP");
        nodes.stage.textContent = stage.name;
        if (nodes.message) nodes.message.textContent = stage.message;
        if (nodes.next) nodes.next.textContent = nextStage ? Math.max(0, nextStage.min - total) : "MAX";

        if (nodes.debugVisits) nodes.debugVisits.value = String(state.visits);
        if (nodes.debugActions) nodes.debugActions.value = String(state.actions);

        if (nodes.plants) {
            const fragment = document.createDocumentFragment();
            for (let index = 0; index < plantCount; index += 1) {
                fragment.append(createPlant(index, plantCount, stageIndex >= 4));
            }
            nodes.plants.replaceChildren(fragment);
        }
    };

    const updateState = (changes) => {
        state = {
            visits: clamp(changes.visits ?? state.visits),
            actions: clamp(changes.actions ?? state.actions)
        };
        saveState();
        render();
    };

    try {
        if (!window.sessionStorage.getItem(visitSessionKey)) {
            state.visits = clamp(state.visits + 1);
            window.sessionStorage.setItem(visitSessionKey, "1");
            saveState();
        }
    } catch {
        state.visits = clamp(state.visits + 1);
    }

    const capabilityTabs = [...document.querySelectorAll("[data-capability-tab]")];
    const capabilityPanels = [...document.querySelectorAll("[data-capability-panel]")];

    const activateCapability = (value, shouldFocus = false) => {
        capabilityTabs.forEach((tab) => {
            const active = tab.dataset.capabilityTab === value;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active && shouldFocus) tab.focus();
        });
        capabilityPanels.forEach((panel) => {
            panel.hidden = panel.dataset.capabilityPanel !== value;
        });
    };

    capabilityTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateCapability(tab.dataset.capabilityTab));
        tab.addEventListener("keydown", (event) => {
            let nextIndex = index;
            if (event.key === "ArrowRight") nextIndex = (index + 1) % capabilityTabs.length;
            if (event.key === "ArrowLeft") nextIndex = (index - 1 + capabilityTabs.length) % capabilityTabs.length;
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = capabilityTabs.length - 1;
            if (nextIndex === index) return;
            event.preventDefault();
            activateCapability(capabilityTabs[nextIndex].dataset.capabilityTab, true);
        });
    });

    if (capabilityTabs.length) {
        activateCapability(capabilityTabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.capabilityTab ?? capabilityTabs[0].dataset.capabilityTab);
    }

    const modeButtons = [...document.querySelectorAll("[data-play-toggle]")];
    const setPlayMode = (active) => {
        document.body.classList.toggle("play-mode", active);
        modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(active)));
        if (active && nodes.lab) {
            nodes.lab.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setPlayMode(!document.body.classList.contains("play-mode"));
        });
    });

    document.addEventListener("click", (event) => {
        const target = event.target.closest("a, button");
        if (!target || target.matches("[data-no-grow], [data-garden-water]")) return;
        updateState({ actions: state.actions + 1 });
    });

    nodes.water?.addEventListener("click", () => {
        updateState({ actions: state.actions + 3 });
    });

    nodes.debugToggle?.addEventListener("click", () => {
        const open = nodes.debugToggle.getAttribute("aria-expanded") !== "true";
        nodes.debugToggle.setAttribute("aria-expanded", String(open));
        if (nodes.debugPanel) nodes.debugPanel.hidden = !open;
    });

    nodes.debugApply?.addEventListener("click", () => {
        updateState({
            visits: nodes.debugVisits?.value,
            actions: nodes.debugActions?.value
        });
    });

    document.querySelectorAll("[data-debug-add]").forEach((button) => {
        button.addEventListener("click", () => {
            updateState({ visits: state.visits + clamp(button.dataset.debugAdd) });
        });
    });

    document.querySelectorAll("[data-debug-add-action]").forEach((button) => {
        button.addEventListener("click", () => {
            updateState({ actions: state.actions + clamp(button.dataset.debugAddAction) });
        });
    });

    nodes.debugReset?.addEventListener("click", () => {
        updateState({ visits: 0, actions: 0 });
    });

    window.addEventListener("storage", (event) => {
        if (event.key !== storageKey) return;
        state = loadState();
        render();
    });

    render();
})();
