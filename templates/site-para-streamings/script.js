(function () {
  'use strict';

  // ===== Reveal on scroll =====
  const revealEls = document.querySelectorAll('.reveal');
  const revealOptions = { threshold: 0.12, rootMargin: '0px 0px -60px 0px' };
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, revealOptions);

  revealEls.forEach(function (el) {
    revealObserver.observe(el);
  });

  // ===== Animate-in elements (hero) =====
  const animateInEls = document.querySelectorAll('.animate-in');
  animateInEls.forEach(function (el) {
    el.style.animationFillMode = 'forwards';
  });

  // ===== Mobile menu =====
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    var navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    function positionNav() {
      var headerRect = menuToggle.closest('.header').getBoundingClientRect();
      nav.style.top = headerRect.bottom + 'px';
    }

    function closeMenu() {
      menuToggle.classList.remove('open');
      nav.classList.remove('open');
      navOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function openMenu() {
      positionNav();
      menuToggle.classList.add('open');
      nav.classList.add('open');
      navOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    menuToggle.addEventListener('click', function () {
      if (nav.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navOverlay.addEventListener('click', closeMenu);

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // ===== Cursor glow follow =====
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow) {
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  // ===== Header scroll =====
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });
  }

  // ===== Smooth anchor =====
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Plans cards: preço por velocidade =====
  var planCards = document.querySelectorAll('.plan-card');
  if (planCards.length) {
    planCards.forEach(function (card) {
      var speedSelect = card.querySelector('.plan-speed-select');
      var priceStrong = card.querySelector('.plan-card-price strong');
      if (!speedSelect || !priceStrong) return;

      function updatePrice() {
        var speed = speedSelect.value;
        var price = card.getAttribute('data-price-' + speed);
        if (!price) return;
        priceStrong.textContent = 'R$ ' + price;
      }

      speedSelect.addEventListener('change', updatePrice);
      updatePrice();
    });
  }

  // ===== Plans cards: carrossel infinito de canais =====
  var plansLogosTracks = document.querySelectorAll('.plan-card-logos-track');
  if (plansLogosTracks.length) {
    plansLogosTracks.forEach(function (track) {
      if (track.dataset.loopReady === 'true') return;
      var logos = Array.from(track.children);
      logos.forEach(function (logo) {
        track.appendChild(logo.cloneNode(true));
      });
      track.dataset.loopReady = 'true';
    });
  }

  // ===== Dados completos de canais por plano (canais_organizacao.md) =====
  var plansChannelData = {
      basico: {
        name: 'Loga Play Básico',
        packageName: 'HUB PLAY',
        total: '18 canais',
        categories: [
          {
            label: 'Ao Vivo',
            channels: [
              { name: 'SBT', logo: 'src/canais/sbt-ao-vivo.png' },
              { name: 'RedeTV!', logo: 'src/canais/rede-tv-ao-vivo-vod.webp' },
              { name: 'RecordTV', logo: 'src/canais/record-tv-ao-vivo.png' },
              { name: 'Band', logo: 'src/canais/band-ao-vivo.png' },
              { name: 'RedeVida', logo: 'src/canais/rede-vida-ao-vivo.png' },
              { name: 'Canção Nova', logo: 'src/canais/cancao-nova-ao-vivo.png' },
              { name: 'TV Brasil', logo: 'src/canais/tv-brasil-ao-vivo.png' },
              { name: 'Gazeta', logo: 'src/canais/gazeta-ao-vivo.png' },
              { name: 'Futura', logo: 'src/canais/futura-ao-vivo.png' },
              { name: 'Aparecida', logo: 'src/canais/aparecida-ao-vivo.png' }
            ]
          },
          {
            label: 'Ao Vivo + VOD',
            channels: [
              { name: 'Desimpedidos', logo: 'src/canais/desimpedidos-ao-vivo-vod.png' },
              { name: 'Sera', logo: 'src/canais/sera-ao-vivo-vod.png' },
              { name: 'Canal do Artesanato', logo: 'src/canais/canal-do-artesanato-ao-vivo-vod.png' },
              { name: 'Good Game', logo: 'src/canais/good-game-ao-vivo-vod.png' },
              { name: 'WHE Play+', logo: 'src/canais/whe-play-plus-ao-vivo-vod.png' },
              { name: 'Manual do Mundo', logo: 'src/canais/manual-do-mundo-ao-vivo-vod.png' },
              { name: 'Acelerados', logo: 'src/canais/acelerados-ao-vivo-vod.png' },
              { name: 'Dance', logo: 'src/canais/fitdance-ao-vivo-vod.png' }
            ]
          },
          {
            label: 'VOD',
            channels: [
              { name: 'Itaú Cultural Play', logo: 'src/canais/itau-cultura-play-vod.png' },
              { name: 'Xpeed', logo: 'src/canais/xpeed-vod.png' },
              { name: 'CNN Brasil', logo: 'src/canais/cnn-brasil-ao-vivo-vod.png' },
              { name: 'Edye', logo: 'src/canais/edye-vod.png' },
              { name: 'Universal+', logo: 'src/canais/universal+-vod.png' },
              { name: 'Lionsgate', logo: 'src/canais/Lionsgate-vod.png' }
            ]
          }
        ]
      },
      cinema: {
        name: 'Loga Play Cinema',
        packageName: 'POWER ULTRA',
        total: '72 canais',
        categories: [
          {
            label: 'Ao Vivo',
            channels: [
              { name: 'TV Globo', logo: 'src/canais/tv-globo-ao-vivo.png' },
              { name: 'SBT', logo: 'src/canais/sbt-ao-vivo.png' },
              { name: 'RedeTV!', logo: 'src/canais/rede-tv-ao-vivo-vod.webp' },
              { name: 'RecordTV', logo: 'src/canais/record-tv-ao-vivo.png' },
              { name: 'Cultura', logo: 'src/canais/cultura-ao-vivo.svg' },
              { name: 'Band', logo: 'src/canais/band-ao-vivo.png' },
              { name: 'RedeVida', logo: 'src/canais/rede-vida-ao-vivo.png' },
              { name: 'Aparecida', logo: 'src/canais/aparecida-ao-vivo.png' },
              { name: 'Canção Nova', logo: 'src/canais/cancao-nova-ao-vivo.png' },
              { name: 'TV Brasil', logo: 'src/canais/tv-brasil-ao-vivo.png' },
              { name: 'Gazeta', logo: 'src/canais/gazeta-ao-vivo.png' },
              { name: 'Futura', logo: 'src/canais/futura-ao-vivo.png' },
              { name: 'BandSports', logo: 'src/canais/band-sport-ao-vivo.png' },
              { name: 'GE TV', logo: 'src/canais/ge-tc-ao-vivo.png' },
              { name: 'ESPN', logo: 'src/canais/ESPN-ao-vivo.png' },
              { name: 'ESPN2', logo: 'src/canais/ESPN2-ao-vivo.png' },
              { name: 'ESPN3', logo: 'src/canais/ESPN3-ao-vivo.png' },
              { name: 'ESPN4', logo: 'src/canais/ESPN4-ao-vivo.png' },
              { name: 'ESPN5', logo: 'src/canais/ESPN5-ao-vivo.PNG' },
              { name: 'ESPN6', logo: 'src/canais/ESPN6-ao-vivo.PNG' },
              { name: 'SporTV', logo: 'src/canais/SPORTV1-ao-vivo.png' },
              { name: 'SporTV2', logo: 'src/canais/SPORTV2-ao-vivo.png' },
              { name: 'SporTV3', logo: 'src/canais/SPORTV3-ao-vivo.png' },
              { name: 'PlayTV', logo: 'src/canais/Playtv-ao-vivo.webp' },
              { name: 'E!', logo: 'src/canais/E!-ao-vivo.svg' },
              { name: 'AgroPlus', logo: 'src/canais/agro-plus-ao-vivo.png' },
              { name: 'Terra Viva', logo: 'src/canais/terra-viva-ao-vivo.png' },
              { name: 'Agro+', logo: 'src/canais/agro-plus-ao-vivo.png' },
              { name: 'Sabor & Arte', logo: 'src/canais/savor-e-arte-ao-vivo.png' },
              { name: 'Dum Dum', logo: 'src/canais/dumdum-ao-vivo.png' },
              { name: 'TV Rá Tim Bum', logo: 'src/canais/ra-ti-vum-ao-vivo.png' },
              { name: 'BandNews', logo: 'src/canais/band-news-ao-vivo.png' },
              { name: 'Globo News', logo: 'src/canais/globo-news-ao-vivo.png' },
              { name: 'Record News', logo: 'src/canais/record-news-ao-vivo.png' },
              { name: 'Times Brasil', logo: 'src/canais/times-brasil-ao-vivo.webp' },
              { name: 'JP News', logo: 'src/canais/jp-news-ao-vivo.png' },
              { name: 'BM&C News', logo: 'src/canais/bmec-news-ao-vivo.webp' },
              { name: 'Universal Premiere', logo: 'src/canais/Universal-Premiere-ao-vivo.png' },
              { name: 'Universal Reality', logo: 'src/canais/Universal-Crime-ao-vivo.webp' },
              { name: 'Universal TV', logo: 'src/canais/UniversalTV-ao-vivo.png' },
              { name: 'DreamWorks', logo: 'src/canais/DreamWorks-ao-vivo.png' },
              { name: 'Studio Universal', logo: 'src/canais/StudioUniversal-ao-vivo.png' },
              { name: 'Megapix', logo: 'src/canais/Megapix-ao-vivo.png' },
              { name: 'USA', logo: 'src/canais/usa-ao-vivo.png' }
            ]
          },
          {
            label: 'Ao Vivo + VOD',
            channels: [
              { name: 'Telecine Premium', logo: 'src/canais/telecine-premium-ao-vivo-vod.png' },
              { name: 'Telecine Action', logo: 'src/canais/telecine-action-ao-vivo-vod.png' },
              { name: 'Telecine Touch', logo: 'src/canais/telecine-touch-ao-vivo-vod.png' },
              { name: 'Telecine Fun', logo: 'src/canais/telecine-fun-ao-vivo-vod.png' },
              { name: 'Telecine Pipoca', logo: 'src/canais/telecine-pipoca-ao-vivo-vod.png' },
              { name: 'AMC', logo: 'src/canais/amc-ao-vivo-vod.png' },
              { name: 'Globoplay Novelas', logo: 'src/canais/globoplay-novelas-ao-vivo-vod.png' },
              { name: 'Canal Brasil', logo: 'src/canais/canal-brasil-ao-vivo-vod.png' },
              { name: 'Modo Viagem', logo: 'src/canais/modo-viagem-ao-vivo-vod.png' },
              { name: 'Off', logo: 'src/canais/canal-off-ao-vivo-vod.png' },
              { name: 'GNT', logo: 'src/canais/gnt-ao-vivo-vod.png' },
              { name: 'CNN Brasil', logo: 'src/canais/cnn-brasil-ao-vivo-vod.png' },
              { name: 'Sera', logo: 'src/canais/sera-ao-vivo-vod.png' },
              { name: 'Desimpedidos', logo: 'src/canais/desimpedidos-ao-vivo-vod.png' },
              { name: 'Canal do Artesanato', logo: 'src/canais/canal-do-artesanato-ao-vivo-vod.png' },
              { name: 'Good Game', logo: 'src/canais/good-game-ao-vivo-vod.png' },
              { name: 'Acelerados', logo: 'src/canais/acelerados-ao-vivo-vod.png' },
              { name: 'Dance', logo: 'src/canais/fitdance-ao-vivo-vod.png' },
              { name: 'WHE Play+', logo: 'src/canais/whe-play-plus-ao-vivo-vod.png' },
              { name: 'Manual do Mundo', logo: 'src/canais/manual-do-mundo-ao-vivo-vod.png' },
              { name: 'Multishow', logo: 'src/canais/multishow-ao-vivo-vod.png' },
              { name: 'BIS', logo: 'src/canais/bis-ao-vivo-vod.png' },
              { name: 'Moonbug', logo: 'src/canais/Moonbug-ao-vivo-vod.png' },
              { name: 'Gloobinho', logo: 'src/canais/Gloobinho-ao-vivo-vod.png' },
              { name: 'Gloob', logo: 'src/canais/Gloob-ao-vivo-vod.png' }
            ]
          },
          {
            label: 'Só VOD',
            channels: [
              { name: 'Itaú Cultural Play', logo: 'src/canais/itau-cultura-play-vod.png' },
              { name: 'Xpeed', logo: 'src/canais/xpeed-vod.png' },
              { name: 'CNN Brasil', logo: 'src/canais/cnn-brasil-ao-vivo-vod.png' },
              { name: 'Edye', logo: 'src/canais/edye-vod.png' },
              { name: 'Universal+', logo: 'src/canais/universal+-vod.png' },
              { name: 'Lionsgate', logo: 'src/canais/Lionsgate-vod.png' }
            ]
          }
        ]
      },
      esporte: {
        name: 'Loga Play Esporte',
        packageName: 'POWER ELITE',
        total: '80 canais',
        categories: [
          {
            label: 'Ao Vivo',
            channels: [
              { name: 'TV Globo', logo: 'src/canais/tv-globo-ao-vivo.png' },
              { name: 'SBT', logo: 'src/canais/sbt-ao-vivo.png' },
              { name: 'RedeTV!', logo: 'src/canais/rede-tv-ao-vivo-vod.webp' },
              { name: 'RecordTV', logo: 'src/canais/record-tv-ao-vivo.png' },
              { name: 'Cultura', logo: 'src/canais/cultura-ao-vivo.svg' },
              { name: 'Band', logo: 'src/canais/band-ao-vivo.png' },
              { name: 'RedeVida', logo: 'src/canais/rede-vida-ao-vivo.png' },
              { name: 'Aparecida', logo: 'src/canais/aparecida-ao-vivo.png' },
              { name: 'Canção Nova', logo: 'src/canais/cancao-nova-ao-vivo.png' },
              { name: 'TV Brasil', logo: 'src/canais/tv-brasil-ao-vivo.png' },
              { name: 'Gazeta', logo: 'src/canais/gazeta-ao-vivo.png' },
              { name: 'Futura', logo: 'src/canais/futura-ao-vivo.png' },
              { name: 'BandSports', logo: 'src/canais/band-sport-ao-vivo.png' },
              { name: 'GE TV', logo: 'src/canais/ge-tc-ao-vivo.png' },
              { name: 'ESPN', logo: 'src/canais/ESPN-ao-vivo.png' },
              { name: 'ESPN2', logo: 'src/canais/ESPN2-ao-vivo.png' },
              { name: 'ESPN3', logo: 'src/canais/ESPN3-ao-vivo.png' },
              { name: 'ESPN4', logo: 'src/canais/ESPN4-ao-vivo.png' },
              { name: 'ESPN5', logo: 'src/canais/ESPN5-ao-vivo.PNG' },
              { name: 'ESPN6', logo: 'src/canais/ESPN6-ao-vivo.PNG' },
              { name: 'SporTV', logo: 'src/canais/SPORTV1-ao-vivo.png' },
              { name: 'SporTV2', logo: 'src/canais/SPORTV2-ao-vivo.png' },
              { name: 'SporTV3', logo: 'src/canais/SPORTV3-ao-vivo.png' },
              { name: 'Premiere', logo: 'src/canais/Premiere-ao-vivo.png' },
              { name: 'Dum Dum', logo: 'src/canais/dumdum-ao-vivo.png' },
              { name: 'TV Rá Tim Bum', logo: 'src/canais/ra-ti-vum-ao-vivo.png' },
              { name: 'BandNews', logo: 'src/canais/band-news-ao-vivo.png' },
              { name: 'Globo News', logo: 'src/canais/globo-news-ao-vivo.png' },
              { name: 'Record News', logo: 'src/canais/record-news-ao-vivo.png' },
              { name: 'Times Brasil', logo: 'src/canais/times-brasil-ao-vivo.webp' },
              { name: 'JP News', logo: 'src/canais/jp-news-ao-vivo.png' },
              { name: 'BM&C News', logo: 'src/canais/bmec-news-ao-vivo.webp' },
              { name: 'Universal Premiere', logo: 'src/canais/Universal-Premiere-ao-vivo.png' },
              { name: 'Universal Reality', logo: 'src/canais/Universal-Crime-ao-vivo.webp' },
              { name: 'Universal TV', logo: 'src/canais/UniversalTV-ao-vivo.png' },
              { name: 'DreamWorks', logo: 'src/canais/DreamWorks-ao-vivo.png' },
              { name: 'Studio Universal', logo: 'src/canais/StudioUniversal-ao-vivo.png' },
              { name: 'Megapix', logo: 'src/canais/Megapix-ao-vivo.png' },
              { name: 'USA', logo: 'src/canais/usa-ao-vivo.png' },
              { name: 'PlayTV', logo: 'src/canais/Playtv-ao-vivo.webp' },
              { name: 'E!', logo: 'src/canais/E!-ao-vivo.svg' },
              { name: 'AgroPlus', logo: 'src/canais/agro-plus-ao-vivo.png' },
              { name: 'Agro+', logo: 'src/canais/agro-plus-ao-vivo.png' },
              { name: 'Sabor & Arte', logo: 'src/canais/savor-e-arte-ao-vivo.png' },
              { name: 'Terra Viva', logo: 'src/canais/terra-viva-ao-vivo.png' },
              { name: 'New Brasil', logo: 'src/canais/new-brasil-ao-vivo.svg' },
              { name: 'Artel', logo: 'src/canais/arte1-ao-vivo.png' }
            ]
          },
          {
            label: 'Ao Vivo + VOD',
            channels: [
              { name: 'Telecine Premium', logo: 'src/canais/telecine-premium-ao-vivo-vod.png' },
              { name: 'Telecine Action', logo: 'src/canais/telecine-action-ao-vivo-vod.png' },
              { name: 'Telecine Touch', logo: 'src/canais/telecine-touch-ao-vivo-vod.png' },
              { name: 'Telecine Fun', logo: 'src/canais/telecine-fun-ao-vivo-vod.png' },
              { name: 'Telecine Pipoca', logo: 'src/canais/telecine-pipoca-ao-vivo-vod.png' },
              { name: 'AMC', logo: 'src/canais/amc-ao-vivo-vod.png' },
              { name: 'Globoplay Novelas', logo: 'src/canais/globoplay-novelas-ao-vivo-vod.png' },
              { name: 'Canal Brasil', logo: 'src/canais/canal-brasil-ao-vivo-vod.png' },
              { name: 'Modo Viagem', logo: 'src/canais/modo-viagem-ao-vivo-vod.png' },
              { name: 'Off', logo: 'src/canais/canal-off-ao-vivo-vod.png' },
              { name: 'GNT', logo: 'src/canais/gnt-ao-vivo-vod.png' },
              { name: 'CNN Brasil', logo: 'src/canais/cnn-brasil-ao-vivo-vod.png' },
              { name: 'Sera', logo: 'src/canais/sera-ao-vivo-vod.png' },
              { name: 'Desimpedidos', logo: 'src/canais/desimpedidos-ao-vivo-vod.png' },
              { name: 'Canal do Artesanato', logo: 'src/canais/canal-do-artesanato-ao-vivo-vod.png' },
              { name: 'Good Game', logo: 'src/canais/good-game-ao-vivo-vod.png' },
              { name: 'Acelerados', logo: 'src/canais/acelerados-ao-vivo-vod.png' },
              { name: 'Dance', logo: 'src/canais/fitdance-ao-vivo-vod.png' },
              { name: 'WHE Play+', logo: 'src/canais/whe-play-plus-ao-vivo-vod.png' },
              { name: 'Manual do Mundo', logo: 'src/canais/manual-do-mundo-ao-vivo-vod.png' },
              { name: 'Multishow', logo: 'src/canais/multishow-ao-vivo-vod.png' },
              { name: 'BIS', logo: 'src/canais/bis-ao-vivo-vod.png' },
              { name: 'Moonbug', logo: 'src/canais/Moonbug-ao-vivo-vod.png' },
              { name: 'Gloobinho', logo: 'src/canais/Gloobinho-ao-vivo-vod.png' },
              { name: 'Gloob', logo: 'src/canais/Gloob-ao-vivo-vod.png' }
            ]
          },
          {
            label: 'Só VOD',
            channels: [
              { name: 'Itaú Cultural Play', logo: 'src/canais/itau-cultura-play-vod.png' },
              { name: 'Xpeed', logo: 'src/canais/xpeed-vod.png' },
              { name: 'CNN Brasil', logo: 'src/canais/cnn-brasil-ao-vivo-vod.png' },
              { name: 'Edye', logo: 'src/canais/edye-vod.png' },
              { name: 'Universal+', logo: 'src/canais/universal+-vod.png' },
              { name: 'Lionsgate', logo: 'src/canais/Lionsgate-vod.png' }
            ]
          }
        ]
      }
    };

  function getAllChannelsFlat(planKey) {
    var plan = plansChannelData[planKey];
    if (!plan) return [];
    var all = [];
    plan.categories.forEach(function (cat) {
      cat.channels.forEach(function (ch) { all.push(ch); });
    });
    return all;
  }

  var planDetailsData = {
    basico: {
      title: 'Loga Play Básico',
      channels: '18 canais',
      benefits: [
        'Até 8 perfis por conta',
        'Até 4 telas simultâneas',
        'Perfil Kids com controle parental',
        'Conteúdo em nuvem com reprodução leve'
      ],
      channelsGrid: getAllChannelsFlat('basico'),
      descriptions: [
        'Plano de entrada para quem quer canais essenciais e VOD no dia a dia.',
        'Ideal para quem busca custo-benefício com uma grade enxuta e boa variedade de entretenimento.',
        'Perfeito para começar no Loga Play e evoluir de plano quando precisar de mais canais.'
      ]
    },
    cinema: {
      title: 'Loga Play Cinema',
      channels: '72 canais',
      benefits: [
        'Foco em filmes e séries premium',
        'Até 8 perfis por conta',
        'Até 4 telas simultâneas',
        'Perfil Kids com controle parental'
      ],
      channelsGrid: getAllChannelsFlat('cinema'),
      descriptions: [
        'Plano com foco em filmes, séries e conteúdo premium, inspirado no pacote Power Ultra.',
        'Excelente para maratonar com variedade de catálogo e canais ao vivo.',
        'Entrega equilíbrio entre catálogo sob demanda e canais lineares.'
      ]
    },
    esporte: {
      title: 'Loga Play Esporte',
      channels: '80 canais',
      benefits: [
        'Foco em esportes e canais premium',
        'Até 8 perfis por conta',
        'Até 4 telas simultâneas',
        'Perfil Kids com controle parental'
      ],
      channelsGrid: getAllChannelsFlat('esporte'),
      descriptions: [
        'Plano indicado para quem acompanha jogos, campeonatos e cobertura esportiva.',
        'Inspirado no pacote Power Elite, combina esporte com variedade de entretenimento.',
        'Mantém acesso a conteúdo on-demand e canais ao vivo em uma experiência única.'
      ]
    }
  };

  // ===== Plans cards: modal de detalhes =====
  var planModal = document.getElementById('planModal');
  var planModalClose = document.getElementById('planModalClose');
  var planDetailsLinks = document.querySelectorAll('.plan-details-link');
  if (planModal && planModalClose && planDetailsLinks.length) {
    var modalTitle = document.getElementById('planModalTitle');
    var modalChannels = document.getElementById('planModalChannels');
    var modalSpeed = document.getElementById('planModalSpeed');
    var modalPrice = document.getElementById('planModalPrice');
    var modalBenefits = document.getElementById('planModalBenefits');
    var modalChannelsGrid = document.getElementById('planModalChannelsGrid');
    var modalDescriptionA = document.getElementById('planModalDescriptionA');
    var modalDescriptionB = document.getElementById('planModalDescriptionB');
    var modalDescriptionC = document.getElementById('planModalDescriptionC');

    function setListItems(target, items) {
      target.innerHTML = '';
      items.forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        target.appendChild(li);
      });
    }

    var CHANNELS_PER_PAGE = 24; // 6 rows × 4 columns
    var modalChCurrentPage = 0;
    var modalChTotalPages = 1;
    var modalChPrevBtn = document.getElementById('planModalChPrev');
    var modalChNextBtn = document.getElementById('planModalChNext');
    var modalChIndicator = document.getElementById('planModalChIndicator');
    var modalChNav = document.getElementById('planModalChannelsNav');

    function createChannelCard(channel) {
      var card = document.createElement('div');
      card.className = 'plan-modal-channel-card';
      if (channel.logo) {
        var img = document.createElement('img');
        img.src = channel.logo;
        img.alt = channel.name || '';
        card.appendChild(img);
      } else {
        var label = document.createElement('span');
        label.textContent = channel.name || '';
        card.appendChild(label);
      }
      return card;
    }

    function renderChannelCards(target, channels) {
      target.innerHTML = '';
      modalChCurrentPage = 0;
      modalChTotalPages = Math.max(1, Math.ceil(channels.length / CHANNELS_PER_PAGE));

      for (var p = 0; p < modalChTotalPages; p++) {
        var page = document.createElement('div');
        page.className = 'plan-modal-channels-page';
        if (p === 0) page.classList.add('active');

        var start = p * CHANNELS_PER_PAGE;
        var end = Math.min(start + CHANNELS_PER_PAGE, channels.length);
        for (var i = start; i < end; i++) {
          page.appendChild(createChannelCard(channels[i]));
        }
        target.appendChild(page);
      }

      updateChannelCarouselUI();
    }

    function updateChannelCarouselUI() {
      if (!modalChNav) return;
      if (modalChTotalPages <= 1) {
        modalChNav.style.display = 'none';
      } else {
        modalChNav.style.display = 'flex';
        modalChIndicator.textContent = (modalChCurrentPage + 1) + ' / ' + modalChTotalPages;
        modalChPrevBtn.disabled = modalChCurrentPage === 0;
        modalChNextBtn.disabled = modalChCurrentPage === modalChTotalPages - 1;
      }
    }

    function goToChannelPage(page) {
      if (page < 0 || page >= modalChTotalPages) return;
      var pages = modalChannelsGrid.querySelectorAll('.plan-modal-channels-page');
      pages.forEach(function (p, idx) {
        p.classList.toggle('active', idx === page);
      });
      modalChCurrentPage = page;
      updateChannelCarouselUI();
    }

    if (modalChPrevBtn && modalChNextBtn) {
      modalChPrevBtn.addEventListener('click', function () {
        goToChannelPage(modalChCurrentPage - 1);
      });
      modalChNextBtn.addEventListener('click', function () {
        goToChannelPage(modalChCurrentPage + 1);
      });
    }

    function openPlanModal(card) {
      var planKey = card.getAttribute('data-plan') || 'basico';
      var details = planDetailsData[planKey] || planDetailsData.basico;
      var speedSelect = card.querySelector('.plan-speed-select');
      var currentSpeed = speedSelect ? speedSelect.options[speedSelect.selectedIndex].textContent : 'NEW 6 - 600 Mega';
      var currentPrice = card.querySelector('.plan-card-price strong');

      modalTitle.textContent = details.title;
      modalChannels.textContent = details.channels;
      modalSpeed.textContent = currentSpeed;
      modalPrice.textContent = (currentPrice ? currentPrice.textContent : 'R$ 0,00') + '/mes';
      setListItems(modalBenefits, details.benefits);
      renderChannelCards(modalChannelsGrid, details.channelsGrid || []);
      modalDescriptionA.textContent = details.descriptions[0];
      modalDescriptionB.textContent = details.descriptions[1];
      modalDescriptionC.textContent = details.descriptions[2];

      planModal.classList.add('open');
      planModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }

    function closePlanModal() {
      planModal.classList.remove('open');
      planModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    planDetailsLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        var card = link.closest('.plan-card');
        if (card) openPlanModal(card);
      });
    });

    planModalClose.addEventListener('click', closePlanModal);

    planModal.addEventListener('click', function (event) {
      var target = event.target;
      if (target && target.getAttribute('data-close-modal') === 'true') {
        closePlanModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && planModal.classList.contains('open')) {
        closePlanModal();
      }
    });
  }

  // ===== Hero tracks: reconstruído do zero com SVG + getPointAtLength =====
  var tracksSvg = document.querySelector('.tracks-svg');
  if (tracksSvg) {
    // Spread tracks apart on mobile
    (function () {
      var desktopPaths = {
        track1: 'M 0 220 C 300 45, 900 45, 1200 220',
        track2: 'M 0 265 C 300 120, 900 120, 1200 265',
        track3: 'M 0 305 C 300 185, 900 185, 1200 305'
      };
      var mobilePaths = {
        track1: 'M 0 170 C 300 5, 900 5, 1200 170',
        track2: 'M 0 255 C 300 110, 900 110, 1200 255',
        track3: 'M 0 318 C 300 240, 900 240, 1200 318'
      };
      function applyTrackPaths() {
        var paths = window.innerWidth <= 768 ? mobilePaths : desktopPaths;
        var t1 = tracksSvg.querySelector('#track1');
        var t2 = tracksSvg.querySelector('#track2');
        var t3 = tracksSvg.querySelector('#track3');
        if (t1) t1.setAttribute('d', paths.track1);
        if (t2) t2.setAttribute('d', paths.track2);
        if (t3) t3.setAttribute('d', paths.track3);
      }
      applyTrackPaths();
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyTrackPaths, 150);
      });
    })();
    var logos = [
      'src/canais/sbt-ao-vivo.png',
      'src/canais/ESPN-ao-vivo.png',
      'src/canais/record-tv-ao-vivo.png',
      'src/canais/SPORTV1-ao-vivo.png',
      'src/canais/band-ao-vivo.png',
      'src/canais/telecine-premium-ao-vivo-vod.png',
      'src/canais/Megapix-ao-vivo.png',
      'src/canais/multishow-ao-vivo-vod.png',
      'src/canais/DreamWorks-ao-vivo.png',
      'src/canais/gnt-ao-vivo-vod.png',
      'src/canais/cnn-brasil-ao-vivo-vod.png',
      'src/canais/Gloob-ao-vivo-vod.png',
      'src/canais/Premiere-ao-vivo.png'
    ];

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var trackConfigs = [
      { pathId: 'track1', layerId: 'trackLayer1', size: 56, speed: prefersReducedMotion ? 0.015 : 0.035, direction: 1, startIndex: 0 },
      { pathId: 'track2', layerId: 'trackLayer2', size: 40, speed: prefersReducedMotion ? 0.013 : 0.03, direction: -1, startIndex: 4 },
      { pathId: 'track3', layerId: 'trackLayer3', size: 36, speed: prefersReducedMotion ? 0.011 : 0.026, direction: 1, startIndex: 8 }
    ];

    var dotCountPerTrack = 5;
    var animatedTracks = [];

    trackConfigs.forEach(function (config) {
      var path = tracksSvg.querySelector('#' + config.pathId);
      var layer = document.getElementById(config.layerId);
      if (!path || !layer) return;

      layer.innerHTML = '';
      var pathLength = path.getTotalLength();
      var dots = [];

      for (var i = 0; i < dotCountPerTrack; i += 1) {
        var dot = document.createElement('div');
        dot.className = 'track-dot';
        dot.style.width = config.size + 'px';
        dot.style.height = config.size + 'px';

        var img = document.createElement('img');
        img.src = logos[(config.startIndex + i) % logos.length];
        img.alt = '';
        dot.appendChild(img);
        layer.appendChild(dot);

        dots.push({
          el: dot,
          progress: i / dotCountPerTrack
        });
      }

      animatedTracks.push({
        path: path,
        pathLength: pathLength,
        dots: dots,
        speed: config.speed,
        direction: config.direction
      });
    });

    var lastTs = 0;
    function animateTracks(ts) {
      if (!lastTs) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;

      var svgRect = tracksSvg.getBoundingClientRect();
      var viewBox = tracksSvg.viewBox.baseVal;
      var scaleX = viewBox.width ? svgRect.width / viewBox.width : 1;
      var scaleY = viewBox.height ? svgRect.height / viewBox.height : 1;

      animatedTracks.forEach(function (track) {
        track.dots.forEach(function (dot) {
          dot.progress += track.speed * track.direction * dt;
          dot.progress = ((dot.progress % 1) + 1) % 1;

          var p = track.path.getPointAtLength(dot.progress * track.pathLength);
          dot.el.style.left = (p.x * scaleX) + 'px';
          dot.el.style.top = (p.y * scaleY) + 'px';
        });
      });

      requestAnimationFrame(animateTracks);
    }

    requestAnimationFrame(animateTracks);
  }

  // ===== Seção 4: restaura carrossel original + abas na esquerda =====
  var programsShowcaseTrack = document.getElementById('programsShowcaseTrack');
  var programsCardsTrack = document.getElementById('programsCardsTrack');
  var programsPrevBtn = document.getElementById('programsPrevBtn');
  var programsNextBtn = document.getElementById('programsNextBtn');
  var programsTabs = document.querySelectorAll('.programs-tab');
  var programsTabsCards = document.getElementById('programsTabsCards');
  if (programsShowcaseTrack && programsCardsTrack && programsPrevBtn && programsNextBtn) {
    var fallbackPrograms = [
      'brasileirao-globoplay.webp',
      'championsleague-hbomax.webp',
      'ladynight-multishow.webp',
      'round6-netflix.webp',
      'pacificador-hbomax.webp',
      'diasperfeitos-globoplay.webp',
      'liloestitch-disney.webp',
      'wandinha-netflix.webp',
      'bundesliga-sportv.webp',
      'thelastofus-hbomax.webp',
      'genv-primevideo.webp',
      'irmosaobra-hh.webp',
      'miraculousladybug-gloob.webp',
      'naruto-adultswim.webp',
      'redacaosportv-sportv.webp'
    ];

    var imageExtRegex = /\.(avif|webp|png|jpe?g|gif|svg)$/i;

    function extractBannerName(href) {
      if (!href) return null;
      var cleanHref = href.split('?')[0].split('#')[0];
      if (!imageExtRegex.test(cleanHref)) return null;
      return cleanHref.split('/').pop();
    }

    function buildBannerPath(fileName) {
      return 'src/banners_programas/' + fileName;
    }

    var channelLogoByKey = {
      globoplay: 'src/canais/globoplay-novelas-ao-vivo-vod.png',
      sportv: 'src/canais/SPORTV1-ao-vivo.png',
      espn: 'src/canais/ESPN-ao-vivo.png',
      band: 'src/canais/band-ao-vivo.png',
      multishow: 'src/canais/multishow-ao-vivo-vod.png',
      gloob: 'src/canais/Gloob-ao-vivo-vod.png',
      telecine: 'src/canais/telecine-premium-ao-vivo-vod.png',
      megapix: 'src/canais/Megapix-ao-vivo.png',
      dreamworks: 'src/canais/DreamWorks-ao-vivo.png',
      gnt: 'src/canais/gnt-ao-vivo-vod.png',
      cnn: 'src/canais/cnn-brasil-ao-vivo-vod.png',
      sbt: 'src/canais/sbt-ao-vivo.png'
    };

    function extractChannelKey(fileName) {
      var baseName = fileName.replace(/\.[^.]+$/, '');
      var parts = baseName.split('-').filter(Boolean);
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }

    function extractProgramTitle(fileName) {
      return fileName.replace(/\.[^.]+$/, '').trim();
    }

    function renderCardStates(cards, activeIndex) {
      var total = cards.length;
      cards.forEach(function (card, index) {
        var relative = (index - activeIndex + total) % total;
        card.style.setProperty('--slot', relative);
        card.removeAttribute('data-hidden');

        if (relative === 0) {
          card.dataset.state = 'active';
          card.tabIndex = 0;
        } else if (relative === 1) {
          card.dataset.state = 'near';
          card.tabIndex = 0;
        } else if (relative === 2) {
          card.dataset.state = 'far';
          card.tabIndex = 0;
        } else {
          card.dataset.state = 'far';
          card.dataset.hidden = 'true';
          card.tabIndex = -1;
        }
      });
    }

    function mountProgramBanners(fileNames) {
      var uniqueFiles = Array.from(new Set(fileNames));
      var banners = uniqueFiles.length ? uniqueFiles : fallbackPrograms;

      programsShowcaseTrack.innerHTML = '';
      programsCardsTrack.innerHTML = '';

      banners.forEach(function (fileName, index) {
        var img = document.createElement('img');
        img.src = buildBannerPath(fileName);
        img.alt = '';
        img.className = 'programs-showcase-banner';
        img.loading = 'lazy';
        if (index === 0) {
          img.classList.add('active');
        }
        programsShowcaseTrack.appendChild(img);

        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'program-card';
        card.setAttribute('aria-label', 'Programa: ' + extractProgramTitle(fileName));

        var cardImg = document.createElement('img');
        cardImg.src = buildBannerPath(fileName);
        cardImg.alt = '';
        cardImg.className = 'program-card-image';
        cardImg.loading = 'lazy';

        var cardMeta = document.createElement('div');
        cardMeta.className = 'program-card-meta';

        var channelKey = extractChannelKey(fileName);
        var channelLogoPath = channelLogoByKey[channelKey] || '';
        if (channelLogoPath) {
          var channelLogo = document.createElement('img');
          channelLogo.src = channelLogoPath;
          channelLogo.alt = '';
          channelLogo.className = 'program-card-logo';
          channelLogo.loading = 'lazy';
          cardMeta.appendChild(channelLogo);
        } else {
          var logoFallback = document.createElement('span');
          logoFallback.className = 'program-card-logo-fallback';
          logoFallback.textContent = (channelKey || 'tv').toUpperCase();
          cardMeta.appendChild(logoFallback);
        }

        var cardTitle = document.createElement('span');
        cardTitle.className = 'program-card-title';
        cardTitle.textContent = extractProgramTitle(fileName);

        cardMeta.appendChild(cardTitle);
        card.appendChild(cardImg);
        card.appendChild(cardMeta);
        programsCardsTrack.appendChild(card);
      });

      startProgramsCarousel();
    }

    function startProgramsCarousel() {
      var slides = programsShowcaseTrack.querySelectorAll('.programs-showcase-banner');
      var cards = programsCardsTrack.querySelectorAll('.program-card');
      if (slides.length <= 1 || cards.length <= 1) return;

      var currentIndex = 0;
      var intervalMs = 5000;
      var transitionMs = 620;
      var isTransitioning = false;
      var autoplayTimer = null;

      function stopAutoplay() {
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
          autoplayTimer = null;
        }
      }

      function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(function () {
          syncToIndex((currentIndex + 1) % slides.length);
        }, intervalMs);
      }

      function syncToIndex(nextIndex) {
        if (isTransitioning || nextIndex === currentIndex) return;
        isTransitioning = true;

        slides[currentIndex].classList.remove('active');
        slides[nextIndex].classList.add('active');
        renderCardStates(cards, nextIndex);
        currentIndex = nextIndex;

        window.setTimeout(function () {
          isTransitioning = false;
        }, transitionMs);
      }

      renderCardStates(cards, currentIndex);

      cards.forEach(function (card, index) {
        card.addEventListener('click', function () {
          stopAutoplay();
          syncToIndex(index);
          startAutoplay();
        });
      });

      programsPrevBtn.addEventListener('click', function () {
        stopAutoplay();
        syncToIndex((currentIndex - 1 + slides.length) % slides.length);
        startAutoplay();
      });

      programsNextBtn.addEventListener('click', function () {
        stopAutoplay();
        syncToIndex((currentIndex + 1) % slides.length);
        startAutoplay();
      });

      programsCardsTrack.addEventListener('mouseenter', function () {
        stopAutoplay();
      });

      programsCardsTrack.addEventListener('mouseleave', function () {
        startAutoplay();
      });

      [programsPrevBtn, programsNextBtn].forEach(function (btn) {
        btn.addEventListener('mouseenter', function () {
          stopAutoplay();
        });
        btn.addEventListener('mouseleave', function () {
          startAutoplay();
        });
      });

      // Touch swipe for programs carousel
      (function () {
        var touchStartX = 0;
        var touchEndX = 0;
        var swipeThreshold = 50;
        var carouselEl = programsCardsTrack.parentElement;

        carouselEl.addEventListener('touchstart', function (e) {
          touchStartX = e.changedTouches[0].screenX;
          stopAutoplay();
        }, { passive: true });

        carouselEl.addEventListener('touchend', function (e) {
          touchEndX = e.changedTouches[0].screenX;
          var diff = touchStartX - touchEndX;
          if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
              syncToIndex((currentIndex + 1) % slides.length);
            } else {
              syncToIndex((currentIndex - 1 + slides.length) % slides.length);
            }
          }
          startAutoplay();
        }, { passive: true });
      })();

      startAutoplay();
    }

    function loadBannersFromDirectory() {
      return fetch('src/banners_programas/')
        .then(function (response) {
          if (!response.ok) throw new Error('Directory listing not available');
          return response.text();
        })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fileNames = Array.from(doc.querySelectorAll('a[href]'))
            .map(function (anchor) { return extractBannerName(anchor.getAttribute('href')); })
            .filter(Boolean);
          if (!fileNames.length) throw new Error('No images listed');
          return fileNames;
        });
    }

    loadBannersFromDirectory()
      .then(function (fileNames) {
        mountProgramBanners(fileNames);
      })
      .catch(function () {
        mountProgramBanners(fallbackPrograms);
      });
  }

  if (programsTabs.length) {
    var channelsByCategory = {
      esportes: [
        { name: 'ESPN', logo: 'src/canais/ESPN-ao-vivo.png' },
        { name: 'SporTV', logo: 'src/canais/SPORTV1-ao-vivo.png' },
        { name: 'SporTV2', logo: 'src/canais/SPORTV2-ao-vivo.png' },
        { name: 'BandSports', logo: 'src/canais/band-sport-ao-vivo.png' },
        { name: 'Premiere', logo: 'src/canais/Premiere-ao-vivo.png' }
      ],
      'filmes-series': [
        { name: 'Telecine Premium', logo: 'src/canais/telecine-premium-ao-vivo-vod.png' },
        { name: 'Telecine Action', logo: 'src/canais/telecine-action-ao-vivo-vod.png' },
        { name: 'Megapix', logo: 'src/canais/Megapix-ao-vivo.png' },
        { name: 'AMC', logo: 'src/canais/amc-ao-vivo-vod.png' },
        { name: 'Universal+', logo: 'src/canais/universal+-vod.png' }
      ],
      infantil: [
        { name: 'Gloob', logo: 'src/canais/Gloob-ao-vivo-vod.png' },
        { name: 'Gloobinho', logo: 'src/canais/Gloobinho-ao-vivo-vod.png' },
        { name: 'Moonbug', logo: 'src/canais/Moonbug-ao-vivo-vod.png' },
        { name: 'DreamWorks', logo: 'src/canais/DreamWorks-ao-vivo.png' },
        { name: 'TV Rá Tim Bum', logo: 'src/canais/ra-ti-vum-ao-vivo.png' }
      ],
      musical: [
        { name: 'BIS', logo: 'src/canais/bis-ao-vivo-vod.png' },
        { name: 'Multishow', logo: 'src/canais/multishow-ao-vivo-vod.png' },
        { name: 'Dance', logo: 'src/canais/fitdance-ao-vivo-vod.png' }
      ],
      noticias: [
        { name: 'CNN Brasil', logo: 'src/canais/cnn-brasil-ao-vivo-vod.png' },
        { name: 'BandNews', logo: 'src/canais/band-news-ao-vivo.png' },
        { name: 'Record News', logo: 'src/canais/record-news-ao-vivo.png' },
        { name: 'JP News', logo: 'src/canais/jp-news-ao-vivo.png' },
        { name: 'GloboNews', logo: 'src/canais/globo-news-ao-vivo.png' }
      ],
      'tv-aberta': [
        { name: 'SBT', logo: 'src/canais/sbt-ao-vivo.png' },
        { name: 'RecordTV', logo: 'src/canais/record-tv-ao-vivo.png' },
        { name: 'Band', logo: 'src/canais/band-ao-vivo.png' },
        { name: 'TV Brasil', logo: 'src/canais/tv-brasil-ao-vivo.png' },
        { name: 'Gazeta', logo: 'src/canais/gazeta-ao-vivo.png' },
        { name: 'Futura', logo: 'src/canais/futura-ao-vivo.png' },
        { name: 'Aparecida', logo: 'src/canais/aparecida-ao-vivo.png' },
        { name: 'RedeVida', logo: 'src/canais/rede-vida-ao-vivo.png' },
        { name: 'Canção Nova', logo: 'src/canais/cancao-nova-ao-vivo.png' },
        { name: 'BandSports', logo: 'src/canais/band-sport-ao-vivo.png' },
        { name: 'ESPN', logo: 'src/canais/ESPN-ao-vivo.png' },
        { name: 'SporTV', logo: 'src/canais/SPORTV1-ao-vivo.png' },
        { name: 'PlayTV', logo: 'src/canais/Playtv-ao-vivo.webp' },
        { name: 'Record News', logo: 'src/canais/record-news-ao-vivo.png' },
        { name: 'BandNews', logo: 'src/canais/band-news-ao-vivo.png' }
      ],
      variedades: [
        { name: 'GNT', logo: 'src/canais/gnt-ao-vivo-vod.png' },
        { name: 'Multishow', logo: 'src/canais/multishow-ao-vivo-vod.png' },
        { name: 'Modo Viagem', logo: 'src/canais/modo-viagem-ao-vivo-vod.png' },
        { name: 'Off', logo: 'src/canais/canal-off-ao-vivo-vod.png' },
        { name: 'Desimpedidos', logo: 'src/canais/desimpedidos-ao-vivo-vod.png' }
      ]
    };

    function renderTabsCards(category) {
      if (!programsTabsCards) return;
      var channels = channelsByCategory[category] || channelsByCategory.esportes;
      programsTabsCards.innerHTML = '';

      channels.forEach(function (channel) {
        var card = document.createElement('article');
        card.className = 'programs-tabs-card';

        var logo = document.createElement('img');
        logo.src = channel.logo;
        logo.alt = channel.name;
        logo.loading = 'lazy';

        card.appendChild(logo);
        programsTabsCards.appendChild(card);
      });
    }

    programsTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        programsTabs.forEach(function (item) {
          item.classList.remove('is-active');
        });
        tab.classList.add('is-active');
        renderTabsCards(tab.getAttribute('data-category') || 'esportes');
      });
    });

    var activeTab = document.querySelector('.programs-tab.is-active');
    renderTabsCards(activeTab ? activeTab.getAttribute('data-category') : 'esportes');
  }

  // ===== Seção Canais: tabs por plano com categorias =====
  var channelsPlanContent = document.getElementById('channelsPlanContent');
  var channelsPlanTabs = document.querySelectorAll('.channels-plan-tab');

  if (channelsPlanContent && channelsPlanTabs.length && typeof plansChannelData !== 'undefined') {
    function renderChannelsPlan(planKey) {
      var plan = plansChannelData[planKey];
      if (!plan) return;
      channelsPlanContent.innerHTML = '';

      plan.categories.forEach(function (cat, catIdx) {
        var section = document.createElement('div');
        section.className = 'channels-category';

        var header = document.createElement('div');
        header.className = 'channels-category-header';

        var badge = document.createElement('span');
        badge.className = 'channels-category-badge';
        if (cat.label === 'Ao Vivo') badge.classList.add('badge-live');
        else if (cat.label.indexOf('VOD') !== -1 && cat.label.indexOf('Ao Vivo') !== -1) badge.classList.add('badge-hybrid');
        else badge.classList.add('badge-vod');
        badge.textContent = cat.label;

        var count = document.createElement('span');
        count.className = 'channels-category-count';
        count.textContent = cat.channels.length + ' canais';

        header.appendChild(badge);
        header.appendChild(count);
        section.appendChild(header);

        var carousel = document.createElement('div');
        carousel.className = 'channels-carousel-wrapper';

        var track = document.createElement('div');
        track.className = 'channels-carousel-track';
        var direction = catIdx % 2 === 0 ? 'channels-scroll-left' : 'channels-scroll-right';
        track.classList.add(direction);

        function buildItem(ch) {
          var item = document.createElement('div');
          item.className = 'channels-item';
          if (ch.logo) {
            var img = document.createElement('img');
            img.src = ch.logo;
            img.alt = ch.name;
            img.loading = 'lazy';
            item.appendChild(img);
          } else {
            var fallback = document.createElement('span');
            fallback.className = 'channels-item-fallback';
            fallback.textContent = ch.name;
            item.appendChild(fallback);
          }
          var label = document.createElement('span');
          label.className = 'channels-item-name';
          label.textContent = ch.name;
          item.appendChild(label);
          return item;
        }

        var itemWidth = 112;
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        var minItems = Math.ceil((viewportWidth * 2) / itemWidth) + 2;
        var setsNeeded = Math.max(2, Math.ceil(minItems / cat.channels.length));
        if (setsNeeded % 2 !== 0) setsNeeded++;

        for (var r = 0; r < setsNeeded; r++) {
          cat.channels.forEach(function (ch) {
            var el = buildItem(ch);
            if (r >= setsNeeded / 2) el.setAttribute('aria-hidden', 'true');
            track.appendChild(el);
          });
        }

        var speed = Math.max(15, (setsNeeded / 2) * cat.channels.length * 1.8);
        track.style.animationDuration = speed + 's';

        carousel.appendChild(track);
        section.appendChild(carousel);
        channelsPlanContent.appendChild(section);
      });
    }

    channelsPlanTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        channelsPlanTabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        renderChannelsPlan(tab.getAttribute('data-channels-plan') || 'basico');
      });
    });

    renderChannelsPlan('basico');
  }

  // ===== Idle Slideshow (10s inatividade) =====
  var idleOverlay = document.getElementById('idleSlideshow');
  var idleImgCurrent = document.getElementById('idleSlideshowImg');
  var idleImgNext = document.getElementById('idleSlideshowImgNext');

  if (idleOverlay && idleImgCurrent && idleImgNext) {
    var idleBanners = [
      'src/banners_programas/brasileirao-globoplay.webp',
      'src/banners_programas/championsleague-hbomax.webp',
      'src/banners_programas/ladynight-multishow.webp',
      'src/banners_programas/round6-netflix.webp',
      'src/banners_programas/pacificador-hbomax.webp',
      'src/banners_programas/diasperfeitos-globoplay.webp',
      'src/banners_programas/liloestitch-disney.webp',
      'src/banners_programas/wandinha-netflix.webp',
      'src/banners_programas/bundesliga-sportv.webp',
      'src/banners_programas/thelastofus-hbomax.webp',
      'src/banners_programas/genv-primevideo.webp',
      'src/banners_programas/irmosaobra-hh.webp',
      'src/banners_programas/miraculousladybug-gloob.webp',
      'src/banners_programas/naruto-adultswim.webp',
      'src/banners_programas/redacaosportv-sportv.webp'
    ];

    var idleTimeout = null;
    var idleSlideTimer = null;
    var idleIndex = 0;
    var idleActive = false;
    var IDLE_DELAY = 10000;
    var SLIDE_INTERVAL = 3000;
    var FADE_DURATION = 800;

    function preloadIdleBanners() {
      idleBanners.forEach(function (src) {
        var img = new Image();
        img.src = src;
      });
    }

    function showIdleSlideshow() {
      if (idleActive) return;
      idleActive = true;
      idleIndex = 0;
      idleImgCurrent.style.backgroundImage = 'url(' + idleBanners[idleIndex] + ')';
      idleImgCurrent.classList.remove('fade-out');
      idleImgNext.classList.remove('fade-in');
      idleOverlay.classList.add('active');
      idleOverlay.setAttribute('aria-hidden', 'false');

      idleSlideTimer = setInterval(function () {
        var nextIndex = (idleIndex + 1) % idleBanners.length;
        idleImgNext.style.backgroundImage = 'url(' + idleBanners[nextIndex] + ')';

        idleImgCurrent.classList.add('fade-out');
        idleImgNext.classList.add('fade-in');

        setTimeout(function () {
          idleImgCurrent.style.backgroundImage = 'url(' + idleBanners[nextIndex] + ')';
          idleImgCurrent.classList.remove('fade-out');
          idleImgNext.classList.remove('fade-in');
          idleIndex = nextIndex;
        }, FADE_DURATION);
      }, SLIDE_INTERVAL);
    }

    function hideIdleSlideshow() {
      if (!idleActive) return;
      idleActive = false;
      idleOverlay.classList.remove('active');
      idleOverlay.setAttribute('aria-hidden', 'true');
      if (idleSlideTimer) {
        clearInterval(idleSlideTimer);
        idleSlideTimer = null;
      }
    }

    function resetIdleTimer() {
      if (idleActive) {
        hideIdleSlideshow();
      }
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(showIdleSlideshow, IDLE_DELAY);
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (evt) {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    preloadIdleBanners();
    idleTimeout = setTimeout(showIdleSlideshow, IDLE_DELAY);
  }
})();
