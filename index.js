let stages = new Stages()
const counter = new CounterItem()

function init () {
  const start = () => {
    stages = new Stages()
    const savedOptions = new Options()
    savedOptions.save()
    stages.createInterval()
  }
  const stop = () => {
    clearInterval(stages.interval)
    counter.clearCounter()
  }
  document.getElementById('start').addEventListener('click', start)
  document.getElementById('stop').addEventListener('click', stop)
}

function CounterItem () {
  const graph = new Graph()
  this.value = 0
  this.minutes = 0
  this.clearCounter = function () {
    this.value = 0
    this.minutes = 0
    graph.drawCircle('#fefefe', 100, 0)
  }
  this.increment = () => {
    this.value++
    setMinutes(this.value)
  }
  this.drawCounter = (color, percent, title) => {
    graph.drawCircle(color, percent, title)
  }

  const setMinutes = (sec) => { this.minutes = parseInt(sec / 60) }
}

function Options () {
  const savedOptions = JSON.parse(window.localStorage.getItem('options'))
  const fields = ['startTime', 'finishTime', 'workingTime', 'intervalWorkTime', 'intervalRestTime']
  const times = {
    startTime: 5 * 60,
    finishTime: 5 * 60,
    workingTime: 30 * 60,
    intervalWorkTime: 30,
    intervalRestTime: 2 * 60
  }
  fields.map(field => {
    let fieldValue = document.getElementById(field).value
    if (fieldValue) times[field] = field === 'intervalWorkTime' ? fieldValue * 1 : fieldValue * 60
    else if (savedOptions && savedOptions[field]) {
      times[field] = parseInt(savedOptions[field])
      document.getElementById(field).value = field === 'intervalWorkTime' ? savedOptions[field] : savedOptions[field] / 60
    }
  })

  const save = () => {
    window.localStorage.setItem('options', JSON.stringify(times))
  }

  return {
    ...times,
    save
  }
}

function Stages () {
  const type = new TypeItem()
  const summary = new SummaryItem()
  const savedOptions = new Options()

  const stageTypes = {
    start: {
      title: 'Разминка...',
      time: 0,
      duration: savedOptions.startTime,
      color: '#5dc274'
    },
    working: {
      title: 'Интервалы',
      duration: 30 * 60,
      color: '#437caf'
    },
    rest: {
      title: 'Отдых...',
      duration: savedOptions.intervalRestTime,
      color: '#437caf'
    },
    work: {
      title: 'Работаем!',
      duration: savedOptions.intervalWorkTime,
      color: '#f54046'
    },
    finish: {
      title: 'Заминка...',
      duration: savedOptions.finishTime,
      color: '#5dc274'
    },
    done: {
      title: 'Закончили!',
      color: '#5dc274'
    }
  }

  let stage = 'start'
  let innerCounter = 0
  let label = `${innerCounter} сек.`
  let percent = (innerCounter * 100) / (stageTypes[stage].duration)
  this.interval = null

  this.createInterval = () => {
    stage = 'start'
    this.interval = setInterval(() => {
      manageStage()
      counter.increment()
      type.drawType(stageTypes[stage].title)
      summary.drawSummary(
        stageTypes[['work', 'rest'].find(t => t === stage) ? 'working' : stage].title,
        counter.minutes
      )
    }, 1000)
  }

  const manageStage = () => {
    if (stage === 'start' && counter.value >= stageTypes['start'].duration) {
      stage = 'work'
      counter.clearCounter()
    } else if (['work', 'rest'].find(t => t === stage) && counter.value >= stageTypes['working'].duration) {
      stage = 'finish'
      innerCounter = 0
      counter.clearCounter()
    } else if (stage === 'finish' && counter.value >= stageTypes['finish'].duration) {
      stage = 'done'
      clearInterval(this.interval)
    } else if (['work', 'rest'].find(t => t === stage)) {
      if (stage === 'work' && innerCounter >= stageTypes['work'].duration) {
        stage = 'rest'
        counter.drawCounter('#fefefe', 100, 0, 20)
      } else if (stage === 'rest' && innerCounter >= stageTypes['rest'].duration + stageTypes['work'].duration) {
        stage = 'work'
        innerCounter = 0
        counter.drawCounter('#fefefe', 100, 0, 20)
      }

      innerCounter++
    }

    if (innerCounter) {
      if (stage === 'work') {
        percent = (innerCounter * 100) / (stageTypes[stage].duration)
        label = `${innerCounter} сек.`
      } else {
        percent = ((innerCounter - 30) * 100) / (stageTypes[stage].duration)
        label = `${parseInt((innerCounter - 30) / 60)} мин.`
      }
    } else {
      percent = (counter.value * 100) / (stageTypes[stage].duration)
      label = `${counter.minutes} мин.`
    }

    counter.drawCounter(
      stageTypes[stage].color,
      percent,
      label
    )

    type.colorizeItem(stageTypes[stage].color)
    summary.colorizeItem(stageTypes[stage].color)
  }
}

function TypeItem () {
  const el = document.getElementById('type')
  this.drawType = function (val) {
    el.innerText = val
  }
  this.colorizeItem = function (color) {
    el.style.color = color
  }
}

function SummaryItem () {
  const el = document.getElementById('summary')
  this.drawSummary = function (type, time) {
    el.innerText = `${type.replace(/[.!]/g, '')}: ${time} мин.`
  }
  this.colorizeItem = function (color) {
    el.style.color = color
  }
}

function Graph () {
  const el = document.getElementById('graph') // get canvas

  const options = {
    percent: el.dataset.percent || 25,
    size: el.dataset.size || 220,
    lineWidth: el.dataset.line || 15,
    rotate: el.dataset.rotate || 0
  }

  const canvas = document.createElement('canvas')
  const span = document.createElement('span')

  if (typeof (window.G_vmlCanvasManager) !== 'undefined') {
    window.G_vmlCanvasManager.initElement(canvas)
  }

  const ctx = canvas.getContext('2d')
  canvas.width = canvas.height = options.size

  el.appendChild(span)
  el.appendChild(canvas)

  ctx.translate(options.size / 2, options.size / 2) // change center
  ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI) // rotate -90 deg

  // imd = ctx.getImageData(0, 0, 240, 240);

  this.drawCircle = function (color, percent, value) {
    const radius = (options.size - options.lineWidth) / 2
    span.textContent = value
    percent = Math.min(Math.max(-1, percent / 100 || 0), 1)

    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, percent <= 0)

    ctx.strokeStyle = color
    ctx.lineCap = 'round' // butt, round or square
    ctx.lineWidth = options.lineWidth
    ctx.stroke()
  }

  this.drawCircle('#efefef', 100, '')
}

init()