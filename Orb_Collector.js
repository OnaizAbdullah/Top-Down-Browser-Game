let canvas;
let context;

let fpsInterval = 1000/30;
let now;
let then = Date.now();

let xhttp;
let request;
let borderDeath;
let section = document.querySelector("#start");
let spawnRate;
let minDist;
let player = {
    x: 0, 
    y: 0,
    radius:10,
    xChange: 0,
    yChange: 0
}
let playerSpeed = 5;
let time = 0;

let enemy = {
    x: 0,
    y: 0,
    size: 30,
    xChange: 0,
    yChange: 0
}
let enemies =  [];
let enemyTracker = 0;
let orbs;
let orbCords = [
    {sx: 0, sy: 100, sw: 900, sh: 900},
    {sx: 1150, sy: 100, sw: 900, sh: 900},
    {sx: 0, sy: 1150, sw: 900, sh: 900},
    {sx: 1150, sy: 1150, sw: 900, sh: 900},
    {sx: 510, sy:2104, sw: 900, sh: 900}
]
let shield = {
    x: -100,
    y: -100,
    size: 30,
    active: false,
    onCanvas: false,
}
let active_time = 0;
let shield_spawn_timer = 0;
let shield_spawn_timings = randint(450, 1200);

let moveLeft = false;
let moveUp = false;
let moveRight = false;
let moveDown = false;

let cheat = false;
let cheat_message;
let double_points = false;
let cheat_message2;
let pause_message;
let restart_msg;
let outcome_element;
let end_score;


let completedLevel = false;
let difficulty;
let pause = false;
let started = false;
let gameOver = false;
let mutedAudio = false;
let mutedSound = false;
let level = 1;
let score = 0;
let key;
let level_display;
let win_message;

let score_display;
let delay = 0;
let restart = true;
let backgroundImage = new Image();
let enemyImage = new Image();
let orbsImage = new Image();
let shieldImage = new Image();
let mainTheme = new Audio();
let gameOverAudio = new Audio();
let levelFinish = new Audio();
let victorySong = new Audio();
let consumeOrb = new Audio();
let power_up_sound = new Audio();

document.addEventListener("DOMContentLoaded", init, false);

function init(){
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    //setting up players, enemies and other objects
    orbs = drawOrbs();
    
    player.x = (canvas.width - player.radius)/2;
    player.y = (canvas.height - player.radius)/2;

    enemy.x = randint(0, canvas.width); 
    enemy.y = randint(0, canvas.height);
    minDist = player.radius + (enemy.size/2) + 200;
    while(!object_spawn_distance(player,enemy, minDist)){
    enemy.x = randint(0, canvas.width); 
    enemy.y = randint(0, canvas.height);
    }
    enemy.xChange = 3;
    enemy.yChange = 3;

    score_display = document.querySelector("#score");
    level_display = document.querySelector("h4");
    score_display.innerHTML = "Score: " + 0;
    level_display.innerHTML = "Level 1";
    window.addEventListener("keydown", activate, false);
    window.addEventListener("keyup", deactivate, false);
    document.querySelector("h2 + button").addEventListener("click", function(){ selectDifficulty("easy")},false)
    document.querySelector("h2 + button + button").addEventListener("click", function(){ selectDifficulty("medium")},false) 
    document.querySelector("h2 + button + button + button").addEventListener("click", function(){ selectDifficulty("hard")},false) // https://www.w3schools.com/jsref/met_element_addeventlistener.asp - Used to learn more about event listeners

    // https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event - Used to learn about visible change events
    document.addEventListener("visibilitychange",function(){
        if (document.visibilityState === "visible"){
            if (started && !gameOver && score < 150){
                if(mainTheme.paused){
                    mainTheme.play();
                }
            }
            if (completedLevel && levelFinish.paused && !levelFinish.ended && score < 150){
                levelFinish.play();
            } else if (completedLevel && score >= 150){
                mainTheme.pause();
                if (victorySong.paused && !victorySong.ended){
                    victorySong.play();
                }
            }
        }
    }) 

    load_assets([{"var": enemyImage, "url":"static/Red_Virus.png"}, // https://opengameart.org/content/virus-various-colors - Used for virus
        {"var": backgroundImage, "url":"static/Hex_paver_b_edge.png"},// https://opengameart.org/ - Used to get background tile
        {"var": orbsImage, "url":"static/Orbs.png"}, // https://opengameart.org/content/orbs - Used for orbs image
        {"var" :mainTheme, "url":"static/song18.mp3"}, // https://opengameart.org/content/crystal-cave-song18 - Used for main song
        {"var": gameOverAudio, "url":"static/game_over.wav"}, // https://opengameart.org/content/game-over-bad-chest-sfx - Used for death
        {"var": levelFinish, "url":"static/Well_Done.ogg"},// https://opengameart.org/content/well-done - Used for level completion
        {"var": victorySong, "url":"static/victory_song.mp3"}, // https://opengameart.org/content/hyper-ultra-fanfare - Used as final song 
        {"var": consumeOrb, "url":"static/pop1.wav"}, // https://opengameart.org/content/pop-sounds-0 - Used for when player eats orb
        {"var": shieldImage, "url":"static/shield_image.png"}, // https://opengameart.org/content/force-field-shield - Used for shield
        {"var": power_up_sound, "url": "static/power_up_sound.ogg"}], draw)}; // https://opengameart.org/content/power-up-sound-effects - Used for powerUp sound

function draw(){
    if (gameOver === true){
        return;
    }
    request = window.requestAnimationFrame(draw);
    now = Date.now();
    let elapsed = now - then;
    if (elapsed <= fpsInterval){
        return;
    }
    then = now - (elapsed% fpsInterval);


    if (!started){
        if (level === 1 || level === 2 || level === 3){
            section.innerHTML = "Press any arrow keys or WASD to start";
            section.style.display = "block";
        } 
    } else {
        section.innerHTML = "";
        section.style.display = "none";
    }
    
    context.clearRect(0,0, canvas.width, canvas.height);
    context.drawImage(backgroundImage,0,0, canvas.width, canvas.height);

    //adds wobble effect 
    time += 1;
    let wobble = Math.sin(time);
    let wobbleBuffer = player.radius + wobble;

    //pauses the game
    if (!pause && started){
        player.x = player.x + player.xChange;
        player.y = player.y + player.yChange;

        enemy.x = enemy.x + enemy.xChange;
        enemy.y = enemy.y + enemy.yChange;
    }

    //bounding player to border
    if (player.x + player.radius >= canvas.width){
        player.x = canvas.width - wobbleBuffer;
    }
    if(player.x - player.radius <= 0){
        player.x = wobbleBuffer;
    }
    if(player.y - player.radius <= 0){
        player.y = wobbleBuffer;
    }
    if(player.y + player.radius >= canvas.height){
        player.y = canvas.height - wobbleBuffer;
    }

    //creates powerUp
    if (!pause && started){
        spawnShield();
    }
    if (shield.onCanvas === true){
        context.drawImage(shieldImage, shield.x, shield.y, shield.size, shield.size);
    }
    //creates cell
    if (shield.active === true){
        context.shadowBlur = 10;
        context.shadowColor = "green"
        if (active_time <= 60){
            if (Math.floor(active_time/5) % 2 === 0){
                context.shadowBlur = 10;
                context.shadowColor = "green";
            }
            else{
                context.shadowBlur = 0;
            }
        }
    }
    context.fillStyle = "rgba(253, 225, 172, 0.79)";
    context.beginPath();
    context.arc(player.x, player.y, wobbleBuffer, 0, Math.PI*2);
    context.fill();
    if (shield.active === false && active_time <= 0){
        context.shadowBlur = 0;
    }
    //creates cell nucleus
    context.fillStyle = "purple";
    context.beginPath();
    context.arc(player.x, player.y, player.radius/4, 0, Math.PI*2);
    context.fill();

    //creates orbs
    context.shadowBlur = 10;
    context.shadowColor = "cyan"; // https://www.w3schools.com/JSREF/canvas_shadowblur.asp used to learn about shadow blur
    context.drawImage(orbsImage, orbs.orb.sx, orbs.orb.sy, orbs.orb.sw, orbs.orb.sh,orbs.x, orbs.y, (orbs.size + wobble), (orbs.size + wobble));
    context.shadowBlur = 0;

    //creates enemies
    context.shadowBlur = 10;
    context.shadowColor = "rgb(255, 0, 0)";
    context.drawImage(enemyImage,enemy.x,enemy.y, enemy.size, enemy.size);
    context.shadowBlur = 0;

    //adds delay to allow orbs to be consumed fully
    if (delay > 0){
        delay -= 1
        if (delay === 0){
            if (score >= 150){
                stop(score, true);  
            } else {
                stop(score, false);
            }
        }
    }

    //Points scheme
    if (double_points === true){
        if (spawnRate % 2 === 0){
            if (score % spawnRate === 0 && score != 0 && enemyTracker != score){
                addEnemy();
                enemyTracker = score;
            }
        }
        else {
            if (score % (spawnRate+1) === 0 && score != 0 && enemyTracker != score){
                addEnemy();
                enemyTracker = score;
            }
        }   
    } else {
        if (score % spawnRate === 0 && score != 0 && enemyTracker != score){
            addEnemy();
            enemyTracker = score;
        }
    }
    context.fillStyle = "red";
    //sub-enemies
    for (let e of enemies){
        if (pause === false){
            e.x = e.x + e.xChange;
            e.y = e.y + e.yChange;
        }

    if (e.y + e.size >= canvas.height){
        e.y = canvas.height - e.size;
        e.yChange = -e.yChange;}
    if (e.x + e.size >= canvas.width){
        e.x = canvas.width - e.size;
        e.xChange = -e.xChange;}
    if (e.y <= 0){
        e.y = 0;
        e.yChange = -e.yChange;}
    if (e.x <=  0){
        e.x = 0;
        e.xChange = -e.xChange;}
    if (circle_collision(player, e)){
        if (shield.active === false){
            stop(score, true);
            restart_msg.style.display = "block";
            restart_msg.innerHTML = "You Got INFECTED  (Press R to restart)";
            end_score.innerHTML = "Total Score: " + score;
            gameOver = true;
            mainTheme.pause();
            if (gameOverAudio.paused){
                gameOverAudio.currentTime = 0;
                gameOverAudio.play();
            }            
        }
    }
    //draws enemies
    context.shadowBlur = 10;
    context.shadowColor = "rgb(255, 0, 0)";
    context.drawImage(enemyImage,e.x,e.y, e.size, e.size);
    context.shadowBlur = 0;}

    restart_msg = document.querySelector("#restart");

    //enemy bouncing on borders
    if (enemy.y + enemy.size >= canvas.height){
        enemy.y = canvas.height - enemy.size;
        enemy.yChange = -enemy.yChange;
    }
    if (enemy.x + enemy.size >= canvas.width){
        enemy.x = canvas.width - enemy.size;
        enemy.xChange = -enemy.xChange;
    }
    if (enemy.y <= 0){
        enemy.y = 0;
        enemy.yChange = -enemy.yChange;
    }
    if (enemy.x <=  0){
        enemy.x = 0;
        enemy.xChange = -enemy.xChange;
    }

    //User gaining points
    if (circle_collision(player,orbs)){
        consumeOrb.play();
        if (cheat === false){
            player.radius += 2;
        }
        if (double_points === true){
            score += 2;
        } else {
            score += 1;
        }
        score_display = document.querySelector("#score");
        score_display.innerHTML = "Score: " + score;
        
        orbs = drawOrbs()
        //different checkpoints at the game and actions at those checkpoints
        if ((score === 50 || score === 100) && !completedLevel ){
            completedLevel = true;
            levelFinish.play();
            delay = 2;
        }
        if (score >= 150 && !completedLevel){
            completedLevel = true;
            delay = 2;
            mainTheme.pause();
            victorySong.play();
        }
        if ((score === 50 || score === 100) && (levelFinish.ended === true)){
            restart = true;
        } 
        if ((score >= 150) && victorySong.ended=== true){
            restart = true;
        }
    }
    
    //colliding with original enemy
    if (circle_collision(player, enemy)){
        if (shield.active === false){
            stop(score, true);
            gameOver = true;
            restart_msg.style.display = "block";
            restart_msg.innerHTML = "You Got INFECTED  (Press R to restart)"
            end_score.innerHTML = "Total Score: " + score;
            mainTheme.pause();
            if (gameOverAudio.paused){
                gameOverAudio.currentTime = 0;
                gameOverAudio.play();
            }           
        }
    }

    //colliding with border
    if (borderDeath){
        if (player.x + player.radius >= canvas.width 
            || player.x - player.radius <= 0
            || player.y - player.radius <= 0
            || player.y + player.radius >= canvas.height ){
            stop(score, true);
            gameOver = true;
            restart_msg.style.display = "block";
            restart_msg.innerHTML = "YOU HIT THE BORDER AND LOST! (Press R to restart)";
            end_score.innerHTML = "Total Score: " + score;
            mainTheme.pause();
            if (gameOverAudio.paused){
                gameOverAudio.currentTime = 0;
                gameOverAudio.play();
            }
        }
    }
}

// draws orbs for user to eat
function drawOrbs(){
    let orbIndex = randint(0, orbCords.length-1);
    let orb = orbCords[orbIndex];
    let orbSize = 15;
    let player_margin = player.radius + orbSize;
    let newOrb = {
    x: randint(player_margin,canvas.width -  player_margin),
    y: randint(player_margin,canvas.height - player_margin),
    size: orbSize,
    orb: orb
    }
    minDist = player.radius + orbSize + 30;
    while (!object_spawn_distance(player, newOrb, minDist)){
        newOrb.x = randint(player_margin, canvas.width - player_margin);
        newOrb.y = randint(player_margin, canvas.height- player_margin);
    }
    return newOrb;
}

//spawns shields which act as a power-up
function spawnShield(){
    if (pause === false && started === true){
        shield_spawn_timer += 1;
    }
    let bufferZone = player.radius + shield.size;
    if (!shield.active && !shield.onCanvas && shield_spawn_timer >= shield_spawn_timings){
        let newShield = {
            x: randint(bufferZone, canvas.width - bufferZone),
            y: randint(bufferZone, canvas.height - bufferZone),
            size: shield.size
        };
        while (circle_collision(enemy, newShield)){
            newShield.x = randint(bufferZone, canvas.width - bufferZone);
            newShield.y = randint(bufferZone, canvas.height - bufferZone);
        }
        shield.x = newShield.x;
        shield.y = newShield.y;
        shield.onCanvas = true;
        shield_spawn_timer = 0;
    }

    if (shield.onCanvas == true && circle_collision(player, shield)){
        power_up_sound.currentTime = 1;
        power_up_sound.play();
        active_time = 180;
        shield.active = true;
        shield.onCanvas = false;
        shield.x = -100;
        shield.y = -100;
    }

    if (shield.active === true){
        active_time -= 1
        if (active_time <= 0){
            shield.active = false;
        }
    }   
}

//adds in enemies
function addEnemy(){
    let startSpeed = 3;
    let speedInc = startSpeed * Math.pow(1.2,level-1)
    let angle = Math.random() * 2 * Math.PI;

    let newEnemy = (
        {
            x: randint(0,canvas.width),
            y: randint(0, canvas.height),
            size: 30,
            xChange: Math.cos(angle) * speedInc,
            yChange: Math.sin(angle) * speedInc,
        }
    )
    minDist = player.radius + (enemy.size/2) + 200;
        while(!object_spawn_distance(player, newEnemy, minDist) || (shield.onCanvas === true && circle_collision(shield, newEnemy))){
            newEnemy.x = randint(0, canvas.width - newEnemy.size);
            newEnemy.y = randint(0, canvas.height- newEnemy.size);
        };
    enemies.push(newEnemy);
}


function randint(min, max){
    return Math.floor(Math.random()*(max-min +1)) + min;
}

//Deals with different difficulties
function selectDifficulty(selectedChoice){
    difficulty = selectedChoice;
    console.log(selectedChoice)

    if (difficulty === 'easy'){
        spawnRate = 10;
        borderDeath = false;
    }
    else if (difficulty === 'medium'){
        spawnRate = 7;
        borderDeath = false;
    }
    else if (difficulty === 'hard'){
        spawnRate = 5;
        borderDeath = true;
    }
    document.querySelector("canvas + section").style.display = "none";

}

//restarts game
function restartGame(){
    document.querySelector("canvas + section").style.display = "block"; //shows difficulty menu
    restart_msg.style.display = "none";
    player.radius = 8;
    player.x = (canvas.width - player.radius)/2;
    player.y = (canvas.height - player.radius)/2;
    player.xChange = 0;
    player.yChange = 0;

    score = 0;
    score_display = document.querySelector("#score")
    score_display.innerHTML = "Score: " + 0;
    playerSpeed = 5;
    level = 1;
    completedLevel = false;
    gameOver = false;
    pause = false;
    shield.active = false;
    shield.onCanvas = false;
    shield.x = -100;
    shield.y = -100;
    active_time = 0;

    moveLeft = false;
    moveUp = false;
    moveRight = false;
    moveDown = false;

    mainTheme.muted = mutedAudio;
    victorySong.muted = mutedAudio;
    consumeOrb.muted = mutedSound;
    power_up_sound.muted = mutedSound;
    levelFinish.muted = mutedSound;
    gameOverAudio.muted = mutedSound;

    enemies = [];

    enemy.x = randint(0, canvas.width - 10);
    enemy.y = randint(0, canvas.height - 10);
    minDist = player.radius + (enemy.size/2) + 200;
    while(!object_spawn_distance(player,enemy, minDist)){
        enemy.x = randint(0, canvas.width); 
        enemy.y = randint(0, canvas.height);
    }

    enemy.xChange = 3;
    enemy.yChange = 3;

    orbs = drawOrbs();
    document.querySelector("#outcome").innerHTML = "";
    document.querySelector("#end_score").innerHTML = "";
    levelFinish.innerHTML = "";
    outcome_element.style.display = "none";
    level_display.innerHTML = "Level " + level;
    difficulty = "";
    restart = true;

    mainTheme.pause();
    gameOverAudio.pause();
    gameOverAudio.currentTime = 0;
    levelFinish.pause();
    levelFinish.currentTime = 0;
    victorySong.pause();
    victorySong.currentTime = 0;


    then = Date.now();
    window.cancelAnimationFrame(draw);
    request = window.requestAnimationFrame(draw);
}

//enables keyboard prompts for game
function activate(event){
    key = event.key
    if ((score === 50 || score === 100) && completedLevel === true){
        if (event.key === "n" || event.key === "N"){
            if (!levelFinish.paused && !mutedSound){
                return;
            }
            level += 1;
            level_display.innerHTML = "Level " + level;
            console.log("N pressed");
            levelFinish.pause();
            completedLevel = false;
            pause = false;
            restart = true;
            started = false;
            shield.active = false;
            shield.onCanvas = false;
            shield.x = -100;
            shield.y = -100;
            active_time = 0;

            enemies = [];
            enemyTracker = score;

            enemy.x = randint(0, canvas.width - 10);
            enemy.y = randint(0, canvas.height - 10);
            minDist = player.radius + (enemy.size/2) + 200;
            while(!object_spawn_distance(player,enemy, minDist)){
            enemy.x = randint(0, canvas.width); 
            enemy.y = randint(0, canvas.height);
            };
            enemy.xChange = enemy.xChange * 1.5;
            enemy.yChange = enemy.yChange * 1.5;

            player.radius = 10;
            player.x = (canvas.width - player.radius)/2;
            player.y = (canvas.height - player.radius)/2;
            player.xChange = 0;
            player.yChange = 0;
            playerSpeed = playerSpeed*1.5;

            outcome_element.style.display = "none";
            outcome_element.innerHTML = "";
            end_score.innerHTML = "";
            levelFinish.currentTime = 0;

            then = Date.now();
            request = window.requestAnimationFrame(draw);
        }
    }

    if (event.key === "k" || event.key === "K"){
        cheat = !cheat;
        if (cheat === true){
        cheat_message = document.querySelector("#cheat");
        cheat_message.innerHTML = "Enemy Size fixed. (Cheat Enabled)";
        cheat_message.style.display = "block";
        }
        if (cheat == false){
        cheat_message = document.querySelector("#cheat");
        cheat_message.innerHTML = "Enemy Size will grow. (Cheat Disabled)";
        cheat_message.style.display = "block";
        }
        console.log("Cheat active:", cheat);
    }
    if (event.key === "t" || event.key === "T"){
        if (started) {
            return;
        }
        double_points = !double_points;
        if (double_points === true){
        cheat_message2 = document.querySelector("#double_points");
        cheat_message2.innerHTML = "Orbs now worth two points. (Cheat Enabled)";
        cheat_message2.style.display = "block";
        }
        if (double_points === false){
        cheat_message2 = document.querySelector("#double_points");
        cheat_message2.innerHTML = "Orbs now worth one point. (Cheat Disabled)";
        cheat_message2.style.display = "block";
        }
        console.log("Cheat active:", cheat);
    }
    if ((event.key === "r" || event.key === "R") && restart === true){
        let victoryPlay = !victorySong.paused && !mutedAudio;
        let levelPlay = !levelFinish.paused && !mutedSound;
        let GameOverPlay = !gameOverAudio.paused && !mutedSound;
            if (victoryPlay || levelPlay || GameOverPlay){
                return;
            }
        restartGame();

        started = false;

        then = Date.now();
        request = window.requestAnimationFrame(draw);
    }
    if (event.key == "p" || event.key == "P"){
        if (!gameOverAudio.paused || !levelFinish.paused || !victorySong.paused || score >= 150 || completedLevel === true || !started){
            return;
            }
        pause = !pause;
        pause_message = document.querySelector("#pause");
        if (pause === true){
            pause_message.innerHTML = "Paused";
            pause_message.style.display = "block"
        }
        else{
            pause_message.innerHTML = "";
            pause_message.style.display = "none";
        }
    }
    if (event.key == "m" || event.key == "M"){
        mutedAudio = !mutedAudio

        mainTheme.muted = mutedAudio;
        victorySong.muted = mutedAudio;
    }
    if((!started && (event.key === "ArrowLeft" || event.key === "a" || event.key === "A" ||
            event.key == "ArrowRight" || event.key === "d" || event.key === "D" ||
            event.key == "ArrowUp" || event.key === "w" || event.key === "W" ||
            event.key == "ArrowDown" || event.key === "s" || event.key === "S") && 
            (difficulty === "easy" || difficulty === "medium" || difficulty == "hard"))){
        started = true;
        mainTheme.play();
        mainTheme.loop = true;
    
        section.style.display = "none";
    }
    if (event.key == "e" || event.key == "E"){
        mutedSound = !mutedSound;
        
        consumeOrb.muted = mutedSound;
        power_up_sound.muted = mutedSound;
        levelFinish.muted = mutedSound;
        gameOverAudio.muted = mutedSound; // https://js6450.github.io/js-audio.html - Found out about many different audio PROPERTIES
    }
    if (difficulty === "easy" || difficulty === "medium" || difficulty == "hard"){
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A"){
            player.xChange = -playerSpeed;
            player.yChange = 0;

        }
        else if (event.key == "ArrowRight" || event.key === "d" || event.key === "D"){
            player.xChange = playerSpeed;
            player.yChange = 0;
        }
        else if( key == "ArrowUp" || event.key === "w" || event.key === "W"){
            player.xChange = 0;
            player.yChange = -playerSpeed;
        }
        else if(event.key == "ArrowDown" || event.key === "s" || event.key === "S"){
            player.xChange = 0;
            player.yChange = playerSpeed;
        }
        event.preventDefault();
        
        if (key === "ArrowLeft"){
            moveLeft = true;
        }
        else if (key ==="ArrowUp") {
            moveUp = true;
        }
        else if (key ==="ArrowRight"){
            moveRight = true;
        }
        else if (key == "ArrowDown"){
            moveDown = true;
        }
    }
}

function deactivate(event){
    let key = event.key
    if (event.key == "ArrowLeft" || 
    event.key == "ArrowRight" ||
    event.key == "ArrowUp" ||
    event.key == "ArrowDown"){
        event.preventDefault();
    }
    if (key === "ArrowLeft"){
        moveLeft = false;
    }
    else if (key ==="ArrowUp") {
        moveUp = false;
    }
    else if (key ==="ArrowRight"){
        moveRight = false;
    }
    else if (key == "ArrowDown"){
        moveDown = false;
    }
}

//Deals with player colliding or any other objects colliding
function circle_collision(player, object){
    let ox = object.x + object.size/2;
    let oy = object.y + object.size/2;
    
    let dist_x = player.x - ox;
    let dist_y = player.y - oy;

    
    let distance = Math.sqrt(dist_x*dist_x + dist_y*dist_y) 
    if (distance <= (player.radius + (object.size/2))){
        return true;
    } else {
        return false;
    }
}

// Makes sure enemy doesnt spawn close to player
function object_spawn_distance(player, object, minDist){
    let ox = object.x + object.size/2;
    let oy = object.y + object.size/2;
    
    let dist_x = player.x - ox;
    let dist_y = player.y - oy;

    
    let distance = Math.sqrt(dist_x*dist_x + dist_y*dist_y);
    if (distance >= minDist){
        return true;
    } else {
        return false;
    }
}

//Messages for when user finishes the game or a level
function stop(outcome, finalScore = false){
    pause = true;
    shield.active = false;
    window.cancelAnimationFrame(request);
    outcome_element = document.querySelector("#outcome");
    end_score = document.querySelector("#end_score");
    outcome_element.innerHTML = "";
    end_score.innerHTML = "";
    if (((score >= 50 && score < 100) || (score >= 100 && score < 150)) && completedLevel){
        outcome_element.style.display = "block";
        outcome_element.innerHTML = "Congratulations! <p> press N for next level</p>";
        end_score.innerHTML = "Score so far: " + outcome;   
    } else if ( (score >= 150) && completedLevel && difficulty ==="easy"){
        outcome_element.style.display = "block";
        outcome_element.innerHTML = "Congratulations, now try winning on medium mode! <p>(Press R to restart)</p>"
        end_score.innerHTML = "Total Score: " + outcome;
    } else if ( (score >= 150) && completedLevel && difficulty ==="medium"){
        outcome_element.style.display = "block";
        outcome_element.innerHTML = "Congratulations, now try hard mode! <p>(Press R to restart)</p>"
        end_score.innerHTML = "Total Score: " + outcome;
    } else if ( (score >= 150) && completedLevel && difficulty ==="hard"){
        outcome_element.style.display = "block";
        outcome_element.innerHTML = "Congratulations, you won an impossible game! <p>(Press R to restart)</p>"
        end_score.innerHTML = "Total Score: " + outcome;
    }
    if (finalScore === true){
        let data = new FormData();
        data.append("score",score);
        data.append("difficulty",difficulty);

        xhttp = new XMLHttpRequest();
        xhttp.addEventListener("readystatechange", handle_response,false);
        xhttp.open("POST", "store_score",true);
        xhttp.send(data);
    }
}

//loads the images and audio files
function load_assets(assets, callback){
    let num_assets = assets.length;
    let loaded = function(){
        console.log("loaded");
        num_assets = num_assets - 1;
        if (num_assets === 0){
            callback();
        }
    };
    for (let asset of assets){
        let element = asset.var;
    
    if (element instanceof HTMLImageElement){
        console.log("img");
        element.addEventListener("load", loaded, false);
    }
    else if ( element instanceof HTMLAudioElement){
        console.log("audio");
        element.addEventListener("canplaythrough", loaded, false);

    }
    element.src = asset.url;
    }
}

function handle_response(){
    if (xhttp.readyState === 4){
        if (xhttp.status === 200){
            if (xhttp.responseText === "success"){
                console.log("Yes");
            }
        }
        else {
            console.log("No");
        }
    }
}
