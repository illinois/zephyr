FROM centos:7
RUN yum -y install epel-release \
  && yum -y install sudo \
  && curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash - \
	&& yum -y install \
  nodejs \
	make \
	clang \
	gcc \
	gcc-c++ \
	centos-release-scl-rh \
	devtoolset-3-gcc \
  devtoolset-3-gcc-c++ \
	valgrind \
	devtoolset-3-valgrind
ENV PATH=/opt/rh/devtoolset-3/root/usr/bin/:${PATH}
RUN node -v
RUN npm -v

# Setup user
RUN useradd ag

# Install and build Zephyr
WORKDIR /app/
COPY . .
# The last step here removes any dev dependnecies to reduce image size
RUN npm install --unsafe-perm && npm run build
