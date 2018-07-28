FROM ubuntu:latest

ENV PYTHONIOENCODING=UTF-8

RUN apt-get update \
    && apt-get install -y sudo curl gnupg \
    && curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - \
    && apt-get install -y \
        sudo \
        make \
        vim \
        clang-3.9 \
        libc++abi-dev \
        libc++-dev \
        valgrind \
        graphviz \
        imagemagick \
        gnuplot \
        nodejs \
    && sudo update-alternatives --install /usr/bin/clang clang /usr/bin/clang-3.9 100 \
    && sudo update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-3.9 100 \
    && sudo update-alternatives --install /usr/bin/llvm-symbolizer llvm-symbolizer /usr/bin/llvm-symbolizer-3.9 100 \
    && useradd ag

COPY . /app/

RUN cd /app && npm install --unsafe-perm && npm --force cache clean

RUN cd /app && npm run build

CMD cd /app/packages/zephyr-grade-server && npm run start