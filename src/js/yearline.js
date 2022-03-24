window.onload = function () {
  const qs = selector => document.querySelector(selector);
  const headerEl = qs(".header");
  const timelineEl = qs(".timeline");
  const yearWidth = 90;

  const data = [
    {
      start: 2017,
      label: "Wobble"
    }
  ];

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
      (item.end && item.end >= after && item.end < before);
  }

  function scaleBase(date) {
    return Math.floor(date / currentScale) * currentScale;
  }

  function calcLeft(item, startPositions) {
    const base = scaleBase(item.start);
    const remainder = item.start - base;
    let offset = (remainder / currentScale) * yearWidth;
    offset += startPositions[base];
    return offset;
  }

  function fillGrid() {
    rightDate = scaleBase(rightDate);

    const startPositions = {};
    for (let item = 0; item < currentItems; item++) {
      const yearDiv = qs(`#${itemId(item)}`);
      const yearDate = rightDate + (1 + item - currentItems) * currentScale;
      startPositions[yearDate] = item * yearWidth;
      yearDiv.innerHTML = yearDate;
    }

    const before = rightDate + currentScale;
    const after = rightDate + (1 - currentItems) * currentScale;
    timelineEl.innerHTML = "";
    data.filter(onGrid(after, before)).forEach(x => {
      const timeDiv = document.createElement("div");
      timeDiv.className = "time";
      timeDiv.innerHTML = x.label;
      timeDiv.style = `left: ${calcLeft(x, startPositions)}px`;
      timelineEl.appendChild(timeDiv);
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
