const path = require('path');
const fs = require('fs/promises');
const { pipe, gotenberg, convert, html, please, to, set, a4 } = require('gotenberg-js-client');

const GOTENBERG_PATH = process.env.GOTENBERG_PATH || 'http://localhost:3001';

async function gotenRenderPdf(inputHtml){
  const toPDF = pipe(
    gotenberg(GOTENBERG_PATH),
    convert,
    html,
    to({
      a4: true,
      marginTop: 0.4, marginRight: 0.4, marginBottom: 0.4, marginLeft: 0.4, // in inches
      emulatedMediaType: 'print',
      preferCssPageSize: true,
      printBackground: true,
      scale: 0.94
    }),
    set(a4),
    please
  );

  const pdf = await toPDF({
    'index.html': inputHtml
  });

  return pdf;
}

module.exports = {gotenRenderPdf};
