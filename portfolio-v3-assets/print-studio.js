const root = document.querySelector('#print-studio');
const canvas = root.querySelector('canvas');
const context = canvas.getContext('2d');
const slider = root.querySelector('input');
const photos = [...document.querySelectorAll('#filmstrip .frame img')].slice(0, 3);
const choices = [...root.querySelectorAll('button')];
const plate = document.createElement('canvas');
const ink = plate.getContext('2d');
let frame = 0;
let generation = 0;
function reveal() {
  const portion = slider.value / 100;
  const x = Math.round(canvas.width * portion);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(plate, 0, 0);
  context.fillStyle = '#edbc86';
  if (x > 0 && x < canvas.width) context.fillRect(x, 0, 2, canvas.height);
  context.clearRect(0, 0, x, canvas.height);
  slider.setAttribute('aria-valuetext', slider.value + '% photograph');
}
async function selectFrame(index) {
  const token = ++generation;
  const image = new Image();
  image.src = photos[index].src;
  image.alt = photos[index].alt;
  await image.decode();
  if (token !== generation) return;
  frame = index;
  const w = canvas.width = plate.width = 960;
  const h = canvas.height = plate.height = 400;
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
  ink.drawImage(image, (w-iw)/2, (h-ih)/2, iw, ih);
  const pixels = ink.getImageData(0,0,w,h).data;
  ink.fillStyle = '#10191b';
  ink.fillRect(0,0,w,h);
  ink.font = '10px monospace';
  const tones = ' .:-=+*#%@';
  for (let y=5; y<h; y+=9) {
    for (let x=3; x<w; x+=6) {
      const p = (y*w+x)*4;
      const brightness = (.21*pixels[p]+.72*pixels[p+1]+.07*pixels[p+2])/255;
      ink.fillStyle = brightness > .57 ? '#ffdfaa' : '#bfa688';
      ink.fillText(tones[Math.round(brightness*9)],x-3,y+3);
    }
  }
  const original = root.querySelector('.print-original');
  original.src = image.currentSrc || image.src;
  original.alt = image.alt;
  choices.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===frame)));
  reveal();
  root.style.display = 'block';
}
slider.addEventListener('input', reveal);
choices.forEach((button,index)=>button.addEventListener('click',()=>selectFrame(index).catch(()=>{})));
new IntersectionObserver((entries,observer)=>{
  if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();selectFrame(0).catch(()=>{});}
},{rootMargin:'500px'}).observe(document.querySelector('.photo-heading'));
