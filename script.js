const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const video = document.getElementById('main-video');
const upload = document.getElementById('upload');
const effectSelect = document.getElementById('effect-select');
const timeDisplay = document.getElementById('time-display');
const progressBar = document.getElementById('progress-bar');
const uploadLabel = document.getElementById('upload-label');

// 1. Video yuklash
upload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        video.src = URL.createObjectURL(file);
        uploadLabel.style.display = 'none'; // Plus tugmasini yashirish
        video.style.display = 'block';
    }
});

// 2. Effektlarni real vaqtda ko'rsatish
effectSelect.addEventListener('change', () => {
    video.style.filter = effectSelect.value;
});

// 3. Timeline harakati
video.addEventListener('timeupdate', () => {
    const progress = (video.currentTime / video.duration) * 100;
    progressBar.style.left = progress + "%";
    
    // Vaqtni formatlash
    let mins = Math.floor(video.currentTime / 60);
    let secs = Math.floor(video.currentTime % 60);
    timeDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// 4. FFmpeg bilan SAVE (Export)
async function saveVideo() {
    const btn = document.getElementById('download-btn');
    if (!upload.files[0]) return alert("Avval video yuklang!");

    btn.innerText = "⏳...";
    btn.disabled = true;

    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    const file = upload.files[0];
    ffmpeg.FS('writeFile', 'in.mp4', await fetchFile(file));

    // Tanlangan filtrni FFmpeg buyrug'iga aylantirish
    let filterCmd = 'copy'; // Default
    if (effectSelect.value.includes('grayscale')) filterCmd = 'format=gray';
    if (effectSelect.value.includes('sepia')) filterCmd = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';

    await ffmpeg.run('-i', 'in.mp4', '-vf', filterCmd, 'out.mp4');

    const data = ffmpeg.FS('readFile', 'out.mp4');
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inshot_export.mp4';
    a.click();

    btn.innerText = "SAVE";
    btn.disabled = false;
}

document.getElementById('download-btn').addEventListener('click', saveVideo);
