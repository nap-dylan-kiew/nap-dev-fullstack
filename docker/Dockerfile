# Shared shell-customization layer for the ict-web and ict-api service images.
# The base image comes from docker-compose.yml so both services share one
# definition (Powerline fonts + oh-my-bash) instead of two drifting copies.
ARG BASE_IMAGE=debian:trixie
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl fontconfig git \
 && rm -rf /var/lib/apt/lists/*

# Powerline fonts: the symbol font plus the patched DejaVu Sans Mono faces.
RUN set -eux; \
    mkdir -p /usr/share/fonts/opentype/powerline /usr/share/fonts/truetype/powerline; \
    curl -fsSL -o /usr/share/fonts/opentype/powerline/PowerlineSymbols.otf \
        https://github.com/powerline/powerline/raw/develop/font/PowerlineSymbols.otf; \
    curl -fsSL -o /etc/fonts/conf.d/10-powerline-symbols.conf \
        https://github.com/powerline/powerline/raw/develop/font/10-powerline-symbols.conf; \
    curl -fsSL -o "/usr/share/fonts/truetype/powerline/DejaVu Sans Mono for Powerline.ttf" \
        "https://github.com/powerline/fonts/raw/master/DejaVuSansMono/DejaVu%20Sans%20Mono%20for%20Powerline.ttf"; \
    curl -fsSL -o "/usr/share/fonts/truetype/powerline/DejaVu Sans Mono Bold for Powerline.ttf" \
        "https://github.com/powerline/fonts/raw/master/DejaVuSansMono/DejaVu%20Sans%20Mono%20Bold%20for%20Powerline.ttf"; \
    fc-cache -f

# oh-my-bash, installed once for all users. No .git, so no auto-update attempts.
RUN git clone --depth=1 https://github.com/ohmybash/oh-my-bash.git /opt/oh-my-bash \
 && rm -rf /opt/oh-my-bash/.git

COPY oh-my-bash.rc /etc/oh-my-bash.rc
RUN printf '\n. /etc/oh-my-bash.rc\n' >> /etc/bash.bashrc \
 && printf '. /etc/oh-my-bash.rc\n' > /etc/profile.d/oh-my-bash.sh \
 && chmod 0644 /etc/profile.d/oh-my-bash.sh
