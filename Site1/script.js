var fs = require('fs');
class Line {
    constructor(id, start, end) {
        this.id = id
        this.start = start
        this.end = end
    }
}
class Bus {
    constructor(line) {
        this.line = line.id
        this.start = line.start
        this.end = line.end
        this.speed = 70
    }
}

// green, purple, red, blue
let line_distances = [
    [1.18, 1.2, 1.14, 1.5, 1.01, 1.26, 1.15, 1.11, 1.08, 1.08]
    , [2.46, 1.75, 1.47, 2.23, 1.81, 2.27, 0]
    , [1.27, 1.49, 1.14, 1.5, 1.87, 1.81, 1.84, 0]
    , [1.06, 0.92, 1.14, 1.47, 1.44, 1.06, 2.31, 0]
]
let avg_time_taken = [
    [60, 60, 60, 75, 60, 60, 60, 60, 60, 0]
    , [120, 90, 60, 60, 90, 120, 0]
    , [60, 60, 60, 60, 100, 90, 100, 0]
    , [60, 60, 60, 80, 80, 120, 0]
]

/*-----------------------*/

function calculateTime(stopA, stopB, line_distances, line, speed) {
    let time = 0;
    if (stopA < stopB) {
        let dis = line_distances[line][stopA];
        time = (dis/speed)*360
    } else {
        let dis = line_distances[line][stopB];
        time = (dis/speed)*360
    }
    return time
}
function random_traffic(speed) {
    // random chance for traffic to slow down bus speed
    // light - medium - heavy traffic
    let rand_chance = Math.random()
    let new_speed = speed
    if (rand_chance < 0.05) {
        // heavy traffic
        new_speed = new_speed * 0.5
    } else if (rand_chance < 0.2) {
        // medium traffic
        new_speed = new_speed * 0.7
    } else if (rand_chance < 0.6) {
        //light traffic
        new_speed = new_speed* 0.9
    }
    return new_speed
}

function timeTakenActual(stopA, stopB, line_distances, bus) {
    let sped = random_traffic(bus.speed)
    time_taken = calculateTime(stopA, stopB, line_distances, bus.line, sped)
    return time_taken
}
function expectedTime(stopA, stopB, line_distances, avg_time_taken, bus) {
    //tnew = told + (told - tactual)
    let t_old = avg_time_taken[bus.line][stop]
    let t_actual = timeTakenActual(stopA, stopB, line_distances, bus)
    let t_new = t_old + (t_old - t_actual)
    return t_new
}

let api_url = 'https://dockerlab.westeurope.cloudapp.azure.com'
let port = 3306
let username = 'DUDB_3'
let password = 'L_YoKUbTOzMbGMa4AcQ3g-aUXWJ1NYTTiiPkzz227q4'

async function callStopAPI(line_distances, avg_time_taken, bus) {
    for (let s = 0; s < line_distances[bus.line].length-1; s++) {
        fetch(api_url, {
            method: 'PUT'
            , body: JSON.stringify({
                line: bus.line
                , stopA: (bus.line+1).toString +'.'+ (s+1).toString // for 1.2 -> 0+1 + 1+1
                , stopB: (bus.line+1).toString +'.'+ (s+1+1).toString // for 1.3 -> 0+1 + 1+1+1
                , actual_time: timeTakenActual(s, s+1, line_distances, bus)
                , expected_time: expectedTime(s, s+1, line_distances, avg_time_taken, bus)
            })
            , headers: {
                'Authorization': 'Basic '&BASE64(username + ':' + password)
                , 'Content-type': 'application/json; charset=UTF-8'
            }
        })
    }

}
function script_wrap(line_distances, avg_time_taken, request, response) {
    response.writeHead(200,{'Content-Type': 'text/plain'});
    fs.readFile('./index.html', null, function(error, data) {
        if (error){
            response.writeHead(404);
            response.write('File not found!');
        } else{
            response.write(data);
        }
        response.end();
    });
    
    let station_start = [[1.1], [2.1], [3.1], [4.1]]
    let station_end = [[1.10], [2.7], [3.8], [4.8]]

    let green_line = new Line(0, station_start[0], station_end[0])
    let purple_line = new Line(1, station_start[1], station_end[1])
    let red_line = new Line(2, station_start[2], station_end[2])
    let blue_line = new Line(3, station_start[3], station_end[3])

    let green_bus = new Bus(green_line)
    let purple_bus = new Bus(purple_line)
    let red_bus = new Bus(red_line)
    let blue_bus = new Bus(blue_line)

    let buses = [green_bus, purple_bus, red_bus, blue_bus]

    for (let l = 0; l < 4; l++) {
        callStopAPI(line_distances, avg_time_taken, buses[l])
    }
}
script_wrap()