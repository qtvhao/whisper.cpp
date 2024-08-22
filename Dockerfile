FROM debian
RUN which git || apt-get update && apt-get install -y git
RUN git clone https://github.com/ggerganov/whisper.cpp.git
RUN which make || apt-get update && apt-get install -y make
RUN which cc || apt-get update && apt-get install -y gcc
RUN which c++ || apt-get update && apt-get install -y g++
WORKDIR /whisper.cpp
RUN make tiny
RUN which whisper.cpp

RUN whisper.cpp -f in.wav -osrt --max-len 1
