(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------- header shadow + real height ---------------------------------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const toggleHeaderShadow = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    toggleHeaderShadow();
    window.addEventListener("scroll", toggleHeaderShadow, { passive: true });

    // The header's height is auto (grows to two lines on narrow screens),
    // so the hero reserves space via this measured value instead of a
    // guessed fixed pixel amount — see --header-height in style.css.
    const setHeaderHeightVar = () => {
      document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    };
    setHeaderHeightVar();

    if ("ResizeObserver" in window) {
      new ResizeObserver(setHeaderHeightVar).observe(header);
    } else {
      window.addEventListener("resize", setHeaderHeightVar);
    }
  }

  /* ---------------------------------- scroll reveal ---------------------------------- */
  const revealTargets = document.querySelectorAll("[data-reveal], [data-reveal-signature]");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("in-view"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------------------------- about parallax ---------------------------------- */
  const aboutSection = document.querySelector(".about");
  const aboutPhoto = document.querySelector(".about__photo");
  const aboutQuote = document.querySelector(".about__quote");
  const canParallax = window.matchMedia("(min-width: 900px)").matches;

  if (aboutSection && aboutPhoto && aboutQuote && canParallax && !prefersReducedMotion) {
    let ticking = false;

    const updateParallax = () => {
      const rect = aboutSection.getBoundingClientRect();
      const progress = 1 - Math.min(Math.max(rect.top / window.innerHeight, -1), 1);
      const photoShift = (progress - 0.5) * 40;
      const quoteShift = (progress - 0.5) * -20;
      aboutPhoto.style.transform = `translateY(${photoShift}px)`;
      aboutQuote.style.transform = `translateY(${quoteShift}px)`;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );

    updateParallax();
  }

  /* ---------------------------------- portfolio ---------------------------------- */
  const portfolioGrid = document.getElementById("portfolio-grid");

  const formatFecha = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";
    const formatted = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const resolveImagePath = (path) => path.replace(/^\//, "");

  const buildPortfolioCard = (item, index) => {
    const article = document.createElement("article");
    article.className = "portfolio__item" + (index % 2 === 1 ? " portfolio__item--reverse" : "");
    article.setAttribute("data-reveal", "");

    const figure = document.createElement("div");
    figure.className = "portfolio__figure";

    if (item.imagen) {
      const img = document.createElement("img");
      img.src = resolveImagePath(item.imagen);
      img.alt = item.titulo || item.tienda || "Publicación del portfolio";
      img.loading = "lazy";
      figure.appendChild(img);
    }

    const stamp = document.createElement("span");
    stamp.className = "signature signature--stamp in-view";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = "Laura Koziel";
    figure.appendChild(stamp);

    const text = document.createElement("div");
    text.className = "portfolio__text";

    const meta = document.createElement("p");
    meta.className = "portfolio__meta";
    const metaParts = [item.tienda, item.ciudad, formatFecha(item.fecha)].filter(Boolean);
    meta.textContent = metaParts.join(" · ");

    const title = document.createElement("h3");
    title.className = "portfolio__title";
    title.textContent = item.titulo || "";

    const desc = document.createElement("p");
    desc.className = "portfolio__desc";
    desc.textContent = item.descripcion || "";

    text.append(meta, title, desc);
    article.append(figure, text);

    return article;
  };

  const renderPortfolio = (items) => {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "portfolio__empty";
      empty.textContent = "Próximamente, nuevas campañas.";
      portfolioGrid.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => fragment.appendChild(buildPortfolioCard(item, index)));
    portfolioGrid.appendChild(fragment);

    const newReveals = portfolioGrid.querySelectorAll("[data-reveal]");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      newReveals.forEach((el) => el.classList.add("in-view"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );
      newReveals.forEach((el) => observer.observe(el));
    }
  };

  if (portfolioGrid) {
    fetch("data/portfolio.json")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar el portfolio.");
        return response.json();
      })
      .then((data) => renderPortfolio(data.items))
      .catch(() => {
        portfolioGrid.innerHTML = "";
        const error = document.createElement("p");
        error.className = "portfolio__error";
        error.textContent = "El portfolio no está disponible en este momento.";
        portfolioGrid.appendChild(error);
      });
  }
})();
