// Gera uma imagem PNG da página inteira (relatório).
// Depende da biblioteca html2canvas, carregada por <script> no index.html.

function today() {
  // AAAA-MM-DD no horário local
  return new Date().toLocaleDateString('sv-SE');
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportPng(button) {
  if (typeof html2canvas !== 'function') {
    alert('A biblioteca de captura não carregou. Verifique a conexão e recarregue a página.');
    return;
  }

  const target = document.querySelector('.page');
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Gerando imagem…';

  try {
    const canvas = await html2canvas(target, {
      scale: 2, // imagem mais nítida
      useCORS: true, // permite avatares de outro domínio, se o servidor deixar
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      onclone: (clonedDoc) => {
        // Carimbo de data só na imagem; a página real não muda.
        const stamp = clonedDoc.createElement('p');
        stamp.textContent = `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`;
        stamp.style.marginTop = '0.5rem';
        (clonedDoc.querySelector('.foot') || clonedDoc.querySelector('.page')).append(stamp);
      },
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Não foi possível gerar o arquivo PNG.');
    download(blob, `ranking-dota-${today()}.png`);
  } catch (err) {
    console.error(err);
    alert('Não foi possível gerar a imagem. Abra o Console (F12) para ver o erro.');
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
