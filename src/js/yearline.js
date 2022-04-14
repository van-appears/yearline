const sampleData = require("./sampleData.json");
const data = [ ...sampleData, {
  "start": (new Date().getFullYear()) + (new Date().getMonth() / 12),
  "label": "Now",
}];

window.onload = function () {
  const qs = selector => document.querySelector(selector);
  const headerEl = qs(".header");
  const timelineEl = qs(".timeline");
  const yearWidth = 90;
  const barLeft = 7;

  let currentItems = 0;
  let currentScale = 1;
  let rightDate = new Date().getFullYear();

  function itemId(item) {
    return `item_${item}`;
  }

  function buildGrid() {
    const width = headerEl.offsetWidth;
    let itemCount = Math.floor(width / yearWidth);
    if (itemCount === currentItems) {
      return;
    }

    headerEl.innerHTML = "";
    currentItems = itemCount;
    for (let item = 0; item < currentItems; item++) {
      const yearDiv = document.createElement("div");
      yearDiv.id = itemId(item);
      yearDiv.className = "year";
      yearDiv.innerHTML = "&nbsp;";
      headerEl.appendChild(yearDiv);
    }
  }

  function onGrid(after, before) {
    return item =>
      (item.start >= after && item.start < before) ||
      (item.end && item.start < after && item.end > after);
  }

  function inScale(item) {
    const { minScale = 1, maxScale = 10000000 } = item;
    return currentScale <= maxScale && currentScale >= minScale;
  }

  function scaleBase(date) {
    return Math.floor(date / currentScale) * currentScale;
  }

  function calcPositions(item, startPositions) {
    const leftBase = scaleBase(item.start);
    const leftRemainder = item.start - leftBase;
    let left = 0;
    let width = undefined;
    let hasLeft = false;
    if (startPositions[leftBase] !== undefined) {
      left = leftRemainder * yearWidth / currentScale;
      left += startPositions[leftBase];
      hasLeft = true;
    }

    if (item.end !== undefined) {
      const rightBase = scaleBase(item.end);
      const rightRemainder = item.end - rightBase;
      const removeBorder = hasLeft ? barLeft : 3;
      if (startPositions[rightBase] !== undefined) {
        width = rightRemainder * yearWidth / currentScale;
        width += startPositions[rightBase];
      } else {
        const maxYear = Object.keys(startPositions).slice(-1)[0];
        width = startPositions.max + 1;
      }
      width = Math.max(width - left - removeBorder, 0);
      return { left, width, hasLeft };
    }

    return { left, hasLeft };
  }

  function fillGrid() {
    rightDate = scaleBase(rightDate);

    const startPositions = {
      max: currentItems * yearWidth
    };
    for (let item = 0; item < currentItems; item++) {
      const yearDiv = qs(`#${itemId(item)}`);
      const yearDate = rightDate + (1 + item - currentItems) * currentScale;
      startPositions[yearDate] = item * yearWidth;
      yearDiv.innerHTML = yearDate;
    }

    const before = rightDate + currentScale;
    const after = rightDate + (1 - currentItems) * currentScale;
    const ranges = [];
    timelineEl.innerHTML = "";
    data
      .filter(onGrid(after, before))
      .filter(inScale)
      .sort((a, b) => {
        const diff = a.start - b.start;
        if (diff) { return diff; }
        return a.label.localeCompare(b.label);
      })
      .forEach(x => {
        const { left, width, hasLeft } = calcPositions(x, startPositions);
        const timeDiv = document.createElement("div");
        const fineRange = ranges.find(({xs}) => {
          return xs.every(({fromX, toX}) => !(left >= fromX && left <= toX));
        });
        const row = fineRange ? fineRange.row : ranges.length;

        let className = "time";
        if (width) { className += " bar"; }
        if (!hasLeft) { className += " noLeft"; }

        timeDiv.className = className;
        timeDiv.innerHTML = `<span>${x.label}</span>`;
        timeDiv.style = `left: ${left}px; width: ${width}px; top:${row * 48}px`;
        timelineEl.appendChild(timeDiv);

        const displayedWidth = timeDiv.children[0].getBoundingClientRect().width;
        const rowRange = ranges[row] = ranges[row] || { row, xs: [] };
        rowRange.xs.push({
          fromX: left,
          toX: left + displayedWidth + barLeft,
        });
      });
  }

  function rebuild() {
    buildGrid();
    fillGrid();
  }

  rebuild();
  window.onresize = rebuild;
  window.onkeydown = function (e) {
    const code = e.keyCode ? e.keyCode : e.which;
    if (code === 37) {
      //left key
      rightDate -= currentScale;
    } else if (code === 38) {
      //up key
      currentScale = Math.max(currentScale / 10, 1);
    } else if (code === 39) {
      //right key
      rightDate += currentScale;
    } else if (code === 40) {
      //down key
      currentScale = Math.min(currentScale * 10, 10000000);
    }
    fillGrid();
  };
};
