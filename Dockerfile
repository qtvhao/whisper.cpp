FROM debian
RUN which git || apt-get update && apt-get install -y git
RUN git clone https://github.com/ggerganov/whisper.cpp.git
RUN which make || apt-get update && apt-get install -y make
RUN which cc || apt-get update && apt-get install -y gcc
RUN which c++ || apt-get update && apt-get install -y g++
RUN which curl || apt-get update && apt-get install -y curl
WORKDIR /whisper.cpp
RUN make tiny
#
# RUN ./main
RUN ln -s /whisper.cpp/main /usr/bin/whisper.cpp
RUN which whisper.cpp || echo "whisper.cpp not found"

RUN whisper.cpp -f in.wav -osrt --max-len 1
