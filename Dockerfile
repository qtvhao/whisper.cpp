FROM debian
RUN which git || apt-get update && apt-get install -y git
RUN git clone https://github.com/ggerganov/whisper.cpp.git
RUN which make || apt-get update && apt-get install -y make
RUN which cc || apt-get update && apt-get install -y gcc
RUN which c++ || apt-get update && apt-get install -y g++
RUN which curl || apt-get update && apt-get install -y curl
WORKDIR /whisper.cpp
RUN make tiny
RUN which ffmpeg || apt-get update && apt-get install -y ffmpeg
#
# RUN ./main
RUN ln -s /whisper.cpp/main /usr/bin/whisper.cpp
RUN which whisper.cpp || echo "whisper.cpp not found"

# COPY synthesize-result-3063359535.aac in.aac
# RUN ffmpeg -i in.aac -ar 16000 in.wav
COPY in.wav .
RUN whisper.cpp --model /whisper.cpp/models/ggml-tiny.bin -f in.wav -osrt --max-len 1 --split-on-word true -l vi
RUN cat in.wav.srt | grep video

# RUN whisper.cpp -f in.aac -osrt --max-len 1
