const shelf = document.querySelector(".toy-shelf");
if (shelf && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            shelf.classList.add("is-visible");
            observer.disconnect();
        }
    });
    observer.observe(shelf);
}
