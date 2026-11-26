/* カーソル追従リング。マウス環境のみ。
   押せる要素の上で拡大するので、クリック可能かどうかの手掛かりになる。
   OSのカーソルは消さない（消すと逆に操作しづらくなるため）。 */
if (window.matchMedia("(pointer: fine)").matches) {
    const ring = document.createElement("div");
    ring.className = "home-cursor";
    ring.setAttribute("aria-hidden", "true");
    document.body.append(ring);

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    document.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse") return;
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
