export function formatBytes () {
  return function (bytes) {
    if (bytes === 0) {
      return '0 Bytes'
    }
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
      return '-'
    }
    var availableUnits = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB']
    var unit = Math.floor(Math.log(bytes) / Math.log(1024))
    var val = (bytes / Math.pow(1024, Math.floor(unit))).toFixed(1)

    return (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) + ' ' + availableUnits[unit]
  }
}

export function megaBytes () {
  return function (bytes) {
    return bytes * 1024 * 1024
  }
}
