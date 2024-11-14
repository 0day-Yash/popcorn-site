const popcorn = {
    initialize() {
        this.polyfill();
    },

    polyfill() {
        const vendors = ['ms', 'moz', 'webkit', 'o'];
        for (let i = 0; i < vendors.length && !window.requestAnimationFrame; i++) {
            window.requestAnimationFrame = window[`${vendors[i]}RequestAnimationFrame`];
            window.cancelAnimationFrame =
                window[`${vendors[i]}CancelAnimationFrame`] ||
                window[`${vendors[i]}CancelRequestAnimationFrame`];
        }
    },

    detectUA(platform, ua) {
        if (/Mac/.test(platform)) return 'mac';
        if (/Win/.test(platform)) return 'win';
        if (/Android/.test(ua)) return 'android';
        if (/Lin/.test(platform)) return /x86_64/.test(platform) ? 'lin-64' : 'lin-32';
        return 'unknown';
    },

    getAndroidVersion() {
        $.getJSON('/android-update.json', (resp) => {
            const updateLink = (type, version, os, arch) => {
                const url = `https://get.popcorntime.sh/android/${version}/${type}-${arch}-release-${version}.apk`;
                $(`a[data-os="${os}"]`)
                    .attr('href', url)
                    .html(i18n.t('download.text', {
                        defaultValue: 'Download Beta %s',
                        postProcess: 'sprintf',
                        sprintf: [version],
                    }));
            };

            const mobileVersion = resp.mobile.release["armeabi-v7a"].versionName.replace(/^0+/, '');
            updateLink('mobile', mobileVersion, 'Android', 'armeabi-v7a');

            const tvVersion = resp.tv.release["armeabi-v7a"].versionName.replace(/^0+/, '');
            updateLink('tv', tvVersion, 'Android TV arm32', 'armeabi-v7a');
            updateLink('tv', tvVersion, 'Android TV x86', 'x86');
        });
    },

    updateDownloads(platform, ua) {
        document.body.classList.add(this.detectUA(platform, ua) || 'nope');
    },

    updateStatus(el, url) {
        $.getJSON(url, (resp) => {
            $(el).addClass(resp.status.indicator);
        });
    },

    smoothScroll() {
        $('a[data-scroll][href*="#"]:not([href="#"])').on('click', function (e) {
            if (
                location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') &&
                location.hostname === this.hostname
            ) {
                const target = $(this.hash.length ? this.hash : `[name=${this.hash.slice(1)}]`);
                if (target.length) {
                    $('html, body').animate({ scrollTop: target.offset().top }, 800);
                    e.preventDefault();
                }
            }
        });
    },

    snow() {
        const particleCount = 75;
        const wind = { x: 2, y: 1 };
        const particles = [];
        let width = window.innerWidth;
        let height = window.innerHeight;
        let halfWidth = width / 2;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.className = 'snow';
        document.body.insertBefore(canvas, document.body.firstChild);

        function setup() {
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: 1 + Math.random() * 3,
                    weight: Math.random() * particleCount,
                    angle: Math.random() * 360,
                });
            }
            handleResize();
            window.addEventListener('resize', handleResize);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('deviceorientation', handleDeviceOrientation);

            window.requestAnimationFrame(render);
        }

        function handleResize() {
            width = window.innerWidth;
            height = window.innerHeight;
            halfWidth = width / 2;
            canvas.width = width;
            canvas.height = height;
        }

        function handleMouseMove(e) {
            wind.x = map(e.clientX - halfWidth, -halfWidth, halfWidth, 4, -4);
        }

        function handleDeviceOrientation(e) {
            wind.x = e.gamma ? map(e.gamma, -60, 60, -4, 4) : 0;
        }

        function render() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(250,250,250,0.8)';
            ctx.beginPath();

            particles.forEach((particle) => {
                ctx.moveTo(particle.x, particle.y);
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            });

            ctx.fill();
            updateParticles();
            window.requestAnimationFrame(render);
        }

        function updateParticles() {
            particles.forEach((particle) => {
                particle.angle += 0.01;
                particle.y += Math.cos(particle.weight) + wind.y + particle.size / 2;
                particle.x += Math.sin(particle.angle) + wind.x;

                if (particle.x > width + 5 || particle.x < -5 || particle.y > height) {
                    if (particle.x > halfWidth) particle.x = -5;
                    else particle.x = width + 5;
                    particle.y = Math.random() * height;
                }
            });
        }

        function map(x, inMin, inMax, outMin, outMax) {
            return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        }

        setup();
    },
};

popcorn.initialize();
popcorn.updateDownloads(navigator.platform, navigator.userAgent);
popcorn.updateStatus('#status', 'https://popcorntime.statuspage.io/api/v1/status.json');
popcorn.smoothScroll();

if ([11, 0].includes(new Date().getMonth())) {
    popcorn.snow();
}
