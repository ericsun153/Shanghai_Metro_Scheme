
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

map.on('load', async function () {

  // map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
  // map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',(error, image) => {
  //   map.addImage('default-marker', image);
  // })

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

  let metro_line = await fetchSync('./data/metro_line.json')
  console.log(metro_line)
  let metro_station = await fetchSync('./data/metro_station.json')
  console.log(metro_line)

  const routes = deepCopy(metro_line);
  const stations = deepCopy(metro_station);

  // 介绍顺序
  let showNames = ['1号线', '2号线', '3号线', '4号线', '5号线', '6号线', '7号线', '8号线', '9号线', '10号线',
    '11号线', '12号线', '13号线', '15号线', '16号线', '17号线', '18号线', '磁悬浮', '浦江线'];
  let pause = false;
  let name = '1号线'
  let mode = 'add'; // minus
  let count = 0;
  let lineFeature = {}, lineIndex = 0, coordinatesArr = [], preLineFeature = {}, preLineIndex = 0, preCoordinatesArr = [];

  const sections = $('.section');
  let currentSection = 0;
  let goingon = true;
  $(window).on('wheel', function (e) {
    console.log(e.originalEvent.deltaY, currentSection)
    // 防抖
    if(!goingon) return;
    goingon = false;
    setTimeout(()=>{
      goingon = true
    },1200)

    if (e.originalEvent.deltaY < 0) { // 向上滚动  
      if (currentSection === 0) {
        window.parent.goPageOne()  // 首页上一屏
      }
      if (currentSection > 0) {
        currentSection--;
        $('html, body').animate({
          scrollTop: sections.eq(currentSection).offset().top
        }, 500);

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
    } else { // 向下滚动  
      if (currentSection < sections.length - 1) {
        currentSection++;
        $('html, body').animate({
          scrollTop: sections.eq(currentSection).offset().top
        }, 500);

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