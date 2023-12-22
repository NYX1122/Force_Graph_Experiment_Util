const fs = require('fs');

const graphConfigPath =
  'C:\\Users\\Matthew Foster\\_03_Tools\\06_Obsidian_Vaults\\Number Theory\\.obsidian\\graph.json';

const experimentFolderPath =
  'C:\\Users\\Matthew Foster\\_03_Tools\\06_Obsidian_Vaults\\Number Theory\\Chain Experiment\\';

const limit = 50;

const generateNoteTitles = function (limit) {
  const noteTitles = [];
  for (let chainNum = 1; chainNum < limit + 1; chainNum++) {
    const chainFolder = [];
    for (let layerNum = 1; layerNum < chainNum + 1; layerNum++) {
      const layerFolder = [];
      for (let unitNum = 1; unitNum < chainNum + 1; unitNum++) {
        layerFolder.push(`D ~ ${chainNum}.${layerNum}.${unitNum}.md`);
      }
      chainFolder.push(layerFolder);
    }
    noteTitles.push(chainFolder);
  }
  return noteTitles;
};

const generateNoteContents = function (limit, noteTitles) {
  const flattenedTitles = noteTitles.flat(2);

  const noteContents = [];
  for (title of flattenedTitles) {
    let content = '';
    const numStr = title.split(' ')[2];

    const [chainNum, layerNum, unitNum] = numStr.split('.');

    content += `---\n`;
    content += `Tags:\n`;
    content += `- Chain_Experiment\n`;
    content += `Chain: ${chainNum}\n`;
    content += `Layer: ${layerNum}\n`;
    content += `Unit: ${unitNum}\n`;
    content += `---\n`;
    content += `\n`;

    let nextUnitNum;
    let nextLayerNum;

    if (parseInt(unitNum) + 1 > chainNum) {
      nextUnitNum = 1;
    } else {
      nextUnitNum = parseInt(unitNum) + 1;
    }

    if (parseInt(layerNum) + 1 > chainNum) {
      nextLayerNum = 1;
    } else {
      nextLayerNum = parseInt(layerNum) + 1;
    }

    content += `[[D ~ ${chainNum}.${layerNum}.${nextUnitNum}]]\n`;
    content += `\n`;
    content += `[[D ~ ${chainNum}.${nextLayerNum}.${unitNum}]]\n`;
    noteContents.push(content);
  }

  return noteContents;
};

function deleteFolderContents(folderPath) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = `${folderPath}/${file}`;
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      deleteFolderContents(filePath);
      fs.rmdirSync(filePath);
    } else if (stats.isFile()) {
      fs.unlinkSync(filePath);
    }
  }
}

const writeNotes = function (noteTitles, noteContents, folderPath) {
  let counter = 0;
  for (const [index, chainFolder] of noteTitles.entries()) {
    const chainFolderName = `Chain ${index + 1}`;
    const fullChainDir = folderPath + chainFolderName + '\\';
    fs.mkdirSync(fullChainDir);
    for (const [index, layerFolder] of chainFolder.entries()) {
      const layerFolderName = `Layer ${index + 1}`;
      const fullLayerDir = fullChainDir + layerFolderName + '\\';
      fs.mkdirSync(fullLayerDir);
      for (const [index, note] of layerFolder.entries()) {
        const noteContent = noteContents[counter];
        counter++;
        const completeNotePath = fullLayerDir + note;
        fs.writeFileSync(completeNotePath, noteContent);
      }
    }
  }
};

const generateColors = function (limit, noteTitles) {
  function rgbToSingleInteger(r, g, b) {
    return (r << 16) + (g << 8) + b;
  }

  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return rgbToSingleInteger(r, g, b);
  }

  const colors = [];

  const flattenedTitles = noteTitles.flat(2);

  for (const [index, title] of flattenedTitles.entries()) {
    const numStr = title.split(' ')[2];

    const [chainNum, layerNum, unitNum] = numStr.split('.');
    const hue = ((unitNum - 1) / chainNum) * 359; // map 1-limit to 1-360
    const saturation = ((layerNum - 1) / chainNum) * 99; // map 1-limit to 1-100
    const lightness = 50;
    const color = hslToRgb(hue, saturation, lightness);
    colors.push(color);
  }

  return colors;
};

const modifyGraphConfig = function (noteTitles, graphConfigPath, colors) {
  const graphConfig = JSON.parse(fs.readFileSync(graphConfigPath));

  const flattenedTitles = noteTitles.flat(2);

  const colorGroupsData = [];

  for (const [index, title] of flattenedTitles.entries()) {
    const numStr = title.split(' ')[2];

    const [chainNum, layerNum, unitNum] = numStr.split('.');
    const color = colors[index];
    colorGroupsData.push({
      color: { a: 1, rgb: color },
      query: `/Chain: ${chainNum}/ /Layer: ${layerNum}/ /Unit: ${unitNum}/`,
    });
  }

  graphConfig.search = `/Chain: ${limit}/`;
  graphConfig.showTags = false;
  graphConfig.showAttachments = false;
  graphConfig.showOrphans = true;
  graphConfig.colorGroups = colorGroupsData;
  graphConfig.textFadeMultiplier = 3;
  graphConfig.nodeSizeMultiplier = 2;
  graphConfig.centerStrength = 0.15;
  graphConfig.repelStrength = 20;
  graphConfig.linkStrength = 1;
  graphConfig.linkDistance = 30;

  fs.writeFileSync(graphConfigPath, JSON.stringify(graphConfig, null, 2));
};

const app = function (limit, experimentFolderPath, graphConfigPath) {
  const noteTitles = generateNoteTitles(limit);
  const noteContents = generateNoteContents(limit, noteTitles);

  deleteFolderContents(experimentFolderPath);
  writeNotes(noteTitles, noteContents, experimentFolderPath);

  const colors = generateColors(limit, noteTitles);

  modifyGraphConfig(noteTitles, graphConfigPath, colors);
};

app(limit, experimentFolderPath, graphConfigPath);
