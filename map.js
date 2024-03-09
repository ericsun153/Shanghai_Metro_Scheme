
// fetch 封装成同步方法
async function fetchSync(url, option = {}) {
  return new Promise((resolve, reject) => {
    fetch(url, option).then(res => res.json()).then(result => resolve(result)).catch(error => reject(error));
  })
}

// 对象拷贝
function toTypeString(param) {
  return Object.prototype.toString.call(param);
}
function isIteration(obj) {
  const objType = toTypeString(obj);
  return objType === '[object Object]' || objType === '[object Array]';
}
function deepCopy(obj) {
  if (!isIteration(obj)) {
    return obj;
  }
  const targetObj = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    // 只对对象自有属性进行拷贝
    if (obj.hasOwnProperty(key)) {
      if (isIteration(obj[key])) {
        targetObj[key] = deepCopy(obj[key]);
      } else {
        targetObj[key] = obj[key];
      }
    }
  }
  return targetObj;
}
function hasIntersection(array1, array2) {
  const set1 = new Set(array1);
  const set2 = new Set(array2);

  for (const item of set1) {
    if (set2.has(item)) {
      return true;
    }
  }

  return false;
}

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiamlhanVuMDM2NSIsImEiOiJjbG5ud3ZuamIwOW51MnFwdGRidTdhM3VjIn0.ojjTPMBCGWjQnUXIfrNuMg';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v9',
  // style: {
  //   version: 8,
  //   sources: {},
  //   layers: []
  // },
  center: [121.44836124838974, 31.142745015648],
  zoom: 9.8,
});
window.map = map;
map.addControl(new mapboxgl.NavigationControl());

let animation = null;
let routes = null;
let stations = null;

map.on('load', async function () {

  // map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
  // map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',(error, image) => {
  //   map.addImage('default-marker', image);
  // })

  let metro_line = await fetchSync('./data/metro_line.json')
  console.log(metro_line)
  let metro_station = await fetchSync('./data/metro_station.json')
  
  routes = deepCopy(metro_line);
  console.log(routes)
  stations = deepCopy(metro_station);

  map.addSource('source_metro_station', {
    'type': 'geojson',
    // 'data': './data/metro_station.json'
    data: { type: 'FeatureCollection', features: [] }
  })

  map.addSource('source_metro_line', {
    'type': 'geojson',
    // 'data': './data/metro_line.json'
    data: { type: 'FeatureCollection', features: [] }
  })

  map.addSource('source_metro_line2', {
    'type': 'geojson',
    data:routes,
    // 'data': './data/metro_line.json'
    // data: { type: 'FeatureCollection', features: [] }
  })

  map.addSource('source_shanghai', {
    'type': 'geojson',
    'data': './data/shanghai.geojson'
  })

  // layer line
  map.addLayer({
    id: 'layer_metro_line',
    type: 'line',
    source: 'source_metro_line',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 4,
      'line-opacity': 1
    },
    // filter: ['==', ['get', 'shortName'], '11号线']
  });

  map.addLayer({
    id: 'layer_metro_line2',
    type: 'line',
    source: 'source_metro_line2',
    layout: {
      visibility: 'none',
    },
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], true],
        ['get', 'color'],
        '#aaa'
      ],
      'line-width': 4,
      'line-opacity': 1
    },
    // filter: ['==', ['get', 'shortName'], '11号线']
  });

  // layer circle
  map.addLayer({
    id: 'layer_metro_station',
    type: 'circle',
    source: 'source_metro_station',
    paint: {
      'circle-radius': 3.5,
      'circle-color': 'skyblue',
      'circle-opacity': 0.5,
      'circle-stroke-color': '#fff',
      'circle-stroke-opacity': 1,
      'circle-stroke-width': .8,
    },
    // filter:['in',['get', 'line'], ['literal', ['99999']]]
  });

  var mypopup = new mapboxgl.Popup({
    className: 'myPopup',
    // anchor:'left',
    maxWidth: '400px',
    offset: [0, 0],
    closeButton: false
  });

  map.on('click', function (e) {
    console.log(e);
  })

  // 介绍顺序
  let showNames = ['1号线', '2号线', '3号线', '4号线', '5号线', '6号线', '7号线', '8号线', '9号线', '10号线', '11号线', '12号线', '13号线', '15号线', '16号线', '17号线', '18号线', '磁悬浮']; // '浦江线'
  let pause = false;
  let name = '1号线'
  let mode = 'add'; // minus
  let count = 0;
  let lineFeature = {}, lineIndex = 0, coordinatesArr = [], preLineFeature = {}, preLineIndex = 0, preCoordinatesArr = [];

  const sections = $('.section'); // ;
  const sectionMaps = $('.section-map'); // $('.section-map');
  let currentSection = 0;
  let goingon = true;
  $(window).on('wheel', function (e) {
    console.log(e.originalEvent.deltaY, currentSection)
    // 防抖
    if (!goingon) return;
    goingon = false;
    setTimeout(() => {
      goingon = true
    }, 1200)


    if (e.originalEvent.deltaY < 0) { // 向上滚动  
      if (currentSection === 0) {
        window.parent.goPagePre()  // 首页上一屏
      }

      if (currentSection > 0) {
        currentSection--;
        $('html, body').animate({
          scrollTop: sections.eq(currentSection).offset().top
        }, 500);
        if (currentSection < sectionMaps.length) {
          name = showNames[currentSection + 1]
          mode = 'minus'
          console.log(name, mode)
          // lineFeature = routes.features.find(fea => fea.properties.shortName === name)
          // lineIndex = routes.features.findIndex(fea => fea.properties.shortName === name)
          // coordinatesArr = lineFeature.geometry.coordinates[0]
          // count = lineFeature.geometry.coordinates[0].length;
          // let currentIndex = 
          metro_line = {
            type: 'FeatureCollection',
            features: routes.features.map((fea, index) => {
              const { shortName } = fea.properties

              if (showNames.slice(0, currentSection + 1).indexOf(shortName) !== -1) {
                return {
                  properties: { ...fea.properties },
                  geometry: {
                    ...fea.geometry,
                  }
                }
              } else {
                return {
                  properties: { ...fea.properties },
                  geometry: {
                    ...fea.geometry,
                    coordinates: [[]]
                  }
                }
              }

            })
          }

          metro_station = {
            type: 'FeatureCollection',
            features: stations.features.filter(fea => {
              const { line } = fea.properties
              return hasIntersection(line, showNames.slice(0, currentSection + 1))
            })
          }
        }
      }
    } else { // 向下滚动  
      // if (currentSection == sections.length - 1){
      //     window.parent.goPageNext()  // 下一屏
      // }
      if (currentSection < sections.length - 1) {
        currentSection++;
        $('html, body').animate({
          scrollTop: sections.eq(currentSection).offset().top
        }, 500);

        if (currentSection < sectionMaps.length) {
          name = showNames[currentSection]
          mode = 'add'
          lineFeature = routes.features.find(fea => fea.properties.shortName === name)
          lineIndex = routes.features.findIndex(fea => fea.properties.shortName === name)
          coordinatesArr = lineFeature.geometry.coordinates[0]
          count = 0

          preLineFeature = routes.features.find(fea => fea.properties.shortName === showNames[currentSection - 1])
          preLineIndex = routes.features.findIndex(fea => fea.properties.shortName === showNames[currentSection - 1])
          preCoordinatesArr = preLineFeature.geometry.coordinates[0]
          metro_line.features[preLineIndex].geometry.coordinates[0] = preCoordinatesArr;

          metro_station = {
            type: 'FeatureCollection',
            features: stations.features.filter(fea => {
              const { line } = fea.properties
              return hasIntersection(line, showNames.slice(0, currentSection))
            })
          }
        }
      }
    }
    if (currentSection !== 19) {
      map.setLayoutProperty('layer_metro_line2', 'visibility', 'none');
    } else {
      map.setLayoutProperty('layer_metro_line2', 'visibility', 'visible');
      map.setFeatureState(
        { source: 'source_metro_line2', id: 2 },
        { hover: true },
      );
    }
    // 阻止默认滚动行为  
    return false;
  });

  // 将coordinates 置空
  metro_line.features.forEach((fea, index) => {
    metro_line.features[index].geometry.coordinates[0] = []
  })

  // addFirstLine();

  // clearMetroLine();

  function clearMetroLine() {
    mode = 'minus'
    map.getSource('source_metro_line').setData({ type: 'FeatureCollection', features: [] });
  }

  window.clearMetroLine = clearMetroLine;

  // 加载第一条地铁线
  function addFirstLine() {
    mode = 'add'
    lineFeature = routes.features.find(fea => fea.properties.shortName === '1号线')
    lineIndex = routes.features.findIndex(fea => fea.properties.shortName === '1号线')
    coordinatesArr = lineFeature.geometry.coordinates[0]
    count = 0
    metro_station = {
      type: 'FeatureCollection',
      features: []
    }
  }

  window.addFirstLine = addFirstLine;

  setInterval(() => {
    if (mode === 'add' && count === coordinatesArr.length) return;
    // if (mode === 'minus' && count === 0) return;
    console.log(name, mode)

    if (mode === 'add') {
      let lnglat = coordinatesArr[count]
      if (count === 0 && metro_line.features[lineIndex].geometry.coordinates[0].length > 0) {
        metro_line.features[lineIndex].geometry.coordinates[0] = []
      }
      metro_line.features[lineIndex].geometry.coordinates[0].push(lnglat);
      count++
    } else if (mode === 'minus') {
      // metro_line.features[lineIndex].geometry.coordinates[0].pop();
      // count--
      // metro_line.features[lineIndex].geometry.coordinates[0] = [];
      // count = 0;
    }
    // then update the map
    map.getSource('source_metro_line').setData(metro_line);
    map.getSource('source_metro_station').setData(metro_station);
  }, 100)

});

// 放大
$('#zoomIn').click(() => {
  map.zoomIn()
})

// 缩小
$('#zoomOut').click(() => {
  map.zoomOut()
})


// render bar
let riJunKeliu = [
  {
    name: 'Line 1',
    kl1: 175,
    kl2: 96,
    color: '#e3032a'
  },
  {
    name: 'Line 2',
    kl1: 187,
    kl2: 108,
    color: '#93d508'
  },
  {
    name: 'Line 3',
    kl1: 62,
    kl2: 40,
    color: '#fbd602'
  },
  {
    name: 'Line 4',
    kl1: 98,
    kl2: 43,
    color: '#461d85'
  },
  {
    name: 'Line 5',
    kl1: 32,
    kl2: 20,
    color: '#944b9a'
  },
  {
    name: 'Line 6',
    kl1: 62,
    kl2: 40,
    color: '#e20265'
  },
  {
    name: 'Line 7',
    kl1: 62,
    kl2: 40,
    color: '#ec6e00'
  },
  {
    name: 'Line 8',
    kl1: 62,
    kl2: 40,
    color: '#0095d9'
  },
  {
    name: 'Line 9',
    kl1: 62,
    kl2: 40,
    color: '#86c9ec'
  },
  {
    name: 'Line 10',
    kl1: 62,
    kl2: 40,
    color: '#c6b0d4'
  },
  {
    name: 'Line 11',
    kl1: 62,
    kl2: 40,
    color: '#86192a'
  },
  {
    name: 'Line 12',
    kl1: 62,
    kl2: 40,
    color: "#00785f"
  },
  {
    name: 'Line 13',
    kl1: 62,
    kl2: 40,
    color: '#e799c0'
  },
  {
    name: 'Line 14',
    kl1: 62,
    kl2: 40,
    color: '#cab48f'
  },
  {
    name: 'Line 15',
    kl1: 62,
    kl2: 40,
    color: '#cab48f'
  },
  {
    name: 'Line 16',
    kl1: 39,
    kl2: 23,
    color: '#98d1c0'
  },
  {
    name: 'Line 17',
    kl1: 42,
    kl2: 24,
    color: '#bc7971'
  },
  {
    name: 'Line 18',
    kl1: 61,
    kl2: 34,
    color: '#c4984f'
  },
  {
    name: '浦江线',
    kl1: 11,
    kl2: 7,
    color: '#008B9A'
  },
]

let htmlRj = ``
riJunKeliu.forEach(element => {
  const { name, kl1, kl2, color } = element
  htmlRj += `<div class="item ${name === 'Line 2' ? 'active' : ''}">
  <div class="sub1">
    <label>${kl1}</label>
    <div class="bar" style="width: ${kl1 / 200 * 100}%;"></div>
  </div>
  <div class="sub2" style="background:${color}">${name}</div>
  <div class="sub3">
    <div class="bar" style="width: ${kl2 / 200 * 100}%;"></div>
    <label>${kl2}</label>
  </div>
</div>`
})

$('#chart1').html(htmlRj)

// let hoveredPolygonId = null;
// $('#chart1').on('click', '.item', function(){
//   $(this).siblings().removeClass('active')
//   $(this).addClass('active')
//   $(this).siblings().find('label').removeClass('show')
//   $(this).find('label').addClass('show')
//   const lineName = $(this).find('.sub2').text()
//   let shortName = ''
//   if (lineName === '浦江线') {
//     shortName = '蒲江线'
//   } else {
//     shortName = lineName.split(' ')[1] + '号线'
//   }

//   if (hoveredPolygonId !== null) {
//     map.setFeatureState(
//       { source: 'source_metro_line', id: hoveredPolygonId },
//       { hover: false },
//     );
//   }
//   hoveredPolygonId = routes.features.find(it=>it.properties.shortName === shortName)?.id;
//   console.log(hoveredPolygonId);
//   if (!hoveredPolygonId) return;
//   map.setLayoutProperty('layer_metro_line2', 'visibility', 'visible');
//   map.setFeatureState(
//     { source: 'source_metro_line', id: hoveredPolygonId },
//     { hover: true },
//   );

// })

// $('#chart1').on('mouseover', '.item', function(){
//   $(this).siblings().find('label').removeClass('show')
//   $(this).siblings('.active').find('label').addClass('show')
//   $(this).find('label').addClass('show')
// })

let stationsData = [
  {
    'weekday': { name: '世纪大道', lines: ['2号线', '4号线', '6号线', '9号线'], kl: 50 },
    'holiday': { name: '人民广场', lines: ['1号线', '2号线', '8号线'], kl: 30 }
  },
  {
    'weekday': { name: '人民广场', lines: ['1号线', '2号线', '8号线'], kl: 46 },
    'holiday': { name: '世纪大道', lines: ['2号线', '4号线', '6号线', '9号线'], kl: 24 }
  },
  {
    'weekday': { name: '徐家汇', lines: ['1号线', '9号线', '11号线'], kl: 36 },
    'holiday': { name: '虹桥火车站', lines: ['2号线', '10号线', '17号线'], kl: 22 }
  },
  {
    'weekday': { name: '虹桥火车站', lines: ['2号线', '10号线', '17号线'], kl: 33 },
    'holiday': { name: '徐家汇', lines: ['1号线', '9号线', '11号线'], kl: 20 }
  },
  {
    'weekday': { name: '汉中路', lines: ['1号线', '12号线', '13号线'], kl: 27 },
    'holiday': { name: '南京东路', lines: ['2号线', '10号线'], kl: 19 }
  },
  {
    'weekday': { name: '静安寺', lines: ['2号线', '7号线', '14号线'], kl: 27 },
    'holiday': { name: '静安寺', lines: ['2号线', '7号线', '14号线'], kl: 15 }
  },
  {
    'weekday': { name: '南京东路', lines: ['2号线', '10号线'], kl: 26 },
    'holiday': { name: '上海火车站', lines: ['1号线', '3号线', '4号线'], kl: 13 }
  },
  {
    'weekday': { name: '龙阳路', lines: ['2号线', '7号线', '16号线', '18号线'], kl: 23 },
    'holiday': { name: '龙阳路', lines: ['2号线', '7号线', '16号线', '18号线'], kl: 13 }
  },
  {
    'weekday': { name: '辛庄', lines: ['1号线', '5号线'], kl: 21 },
    'holiday': { name: '陕西南路', lines: ['1号线', '10号线', '12号线'], kl: 13 }
  },
  {
    'weekday': { name: '陕西南路', lines: ['1号线', '10号线', '12号线'], kl: 21 },
    'holiday': { name: '汉中路', lines: ['1号线', '12号线', '13号线'], kl: 11 }
  }
]

let htmlStas = ``
stationsData.forEach((element, idx) => {
  const { name: w_name, lines: w_lines, kl: w_kl } = element['weekday']
  const { name: h_name, lines: h_lines, kl: h_kl } = element['holiday']
  htmlStas += `<div class="item">
  <div class="sub1" fid="${idx}" tp="weekday">
    <div class="bar1">
      <span>${w_kl}</span>
      <div class="bar" style="width:${w_kl}px;"></div>
    </div>
    <div class="sub21">
      ${w_lines.map(line => {
    let color = riJunKeliu.find(it => it.name === `Line ${line.split('号线')[0]}`).color
    return `<div class="sub2" style="background:${color}">Line ${line.split('号线')[0]}</div>`
  }).join('')}
    </div>
    <label class="label">${w_name}</label>
  </div>
  <div class="sub-m"></div>
  <div class="sub3" fid="${idx}" tp="holiday">
    <label class="label">${h_name}</label>
    <div class="sub21">
      ${h_lines.map(line => {
    let color = riJunKeliu.find(it => it.name === `Line ${line.split('号线')[0]}`).color
    return `<div class="sub2" style="background:${color}">Line ${line.split('号线')[0]}</div>`
  }).join('')}
    </div>
    <div class="bar1">
      <div class="bar" style="width:${h_kl}px;"></div>
      <span>${h_kl}</span>
    </div>
  </div>
</div>`
})
htmlStas += `<div class="w_title">工作日日均客流最高10个地铁站</div><div class='h_title'>周末日均客流最高10个地铁站</div>`
$('#chart2').html(htmlStas)

// let hoveredPolygonId = null;
$('#chart2').on('click', '.item >div', function () {
  $(this).parents('.item').siblings().find('div').removeClass('active')
  $(this).addClass('active')
  // $(this).siblings().find('label').removeClass('show')
  // $(this).find('label').addClass('show')
  const fid = $(this).attr('fid')
  const tp = $(this).attr('tp')
  // const lines = Array.from(new Set((stationsData[+fid]['weekday'].lines).concat(stationsData[+fid]['holiday'].lines)))
  const lines = stationsData[+fid][tp]['lines']

  map.setLayoutProperty('layer_metro_line2', 'visibility', 'visible');

  routes.features.forEach(fea => {
    const { shortName } = fea.properties;
    console.log(fea.id, typeof fea.id)
    // let shortName_ = ''
    // if (shortName === '浦江线') {
    //   shortName_ = '蒲江线'
    // } else {
    //   shortName_ = 'Line ' + shortName.split('号线')[0]
    // }

    if (lines.includes(shortName)) {
      map.setFeatureState(
        { source: 'source_metro_line2', id: fea.id },
        { hover: true },
      );
    } else {
      map.setFeatureState(
        { source: 'source_metro_line2', id: fea.id },
        { hover: false },
      );
    }
  })
  console.log(lines);

})

$('#chart2').on('mouseover', '.item', function () {
  $(this).siblings().find('label').removeClass('show')
  // $(this).siblings('.active').find('label').addClass('show')
  // $(this).find('label').addClass('show')
})