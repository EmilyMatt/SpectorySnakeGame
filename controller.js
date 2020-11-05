"use strict"


//this class is a representation of object position in pixels
class Vector2 {
    constructor(x, y)
    {
        this.x = x
        this.y = y
    }

    equals = (pos, times = 1) => {
        if(Math.abs(this.x - pos.x) < 20*times && Math.abs(this.y - pos.y) < 20*times)
            return true
        else 
            return false
    }
}

class snakeBit {

    constructor(id, pos)
    {
        this.id = id
        this.pos = pos
    }
}

//set up game data
let snakeTwoRules = false
let gameRunning = false
let gamePaused = false
let speed = 100

//set up snake
let snakeHeadPos = new Vector2(10, 10)
let snakeHeadDir = "right"
let snakeArr = []

let gameroomPos
let foodPos
let lastPos

//button checks
let pressed = {up: false, down: false, left: false, right: false}
let changedDir

//SFX
const powerUp = new Audio("./PowerUp.wav")
const music = new Audio('./Music.wav')
const gameOver = new Audio('./GameOver.wav')

//resets the game board and restarts the game
async function initGame(event) {

    gameRunning = false
    await new Promise(resolve => setTimeout( () => resolve(), speed))

    event.path[0].innerText = "Restart"

    gameroomPos = document.querySelector(".game-room").getBoundingClientRect();

    //set random position for the snake's head, nowhere close to the borders of course
    snakeHeadPos = new Vector2(
        gameroomPos.left + 100 + Math.round(Math.random()*(gameroomPos.width - 200)), 
        gameroomPos.top + 100 + Math.round(Math.random()*(gameroomPos.height-200)))
        
    //delete all the snake's body bits, and reset the array containing them
    if (snakeArr.length > 0)
        snakeArr.forEach(element => {
            document.getElementById(`s_${element.id}`).remove()
        })

    snakeArr.length = []

    //reset speed back to default
    speed = 100

    placeFood()
    

    gameRunning = true
    music.loop = true
    music.volume = 0.5
    music.play()

    gameLoop()
    
}

//this places a food at a random position(that isn't on the snake's body)
function placeFood() {

    //randomize position
    foodPos = new Vector2(
        gameroomPos.left + 100 + Math.floor(Math.random()*(gameroomPos.width-200)), 
        gameroomPos.top + 100 + Math.floor(Math.random()*(gameroomPos.height-200))
        )

    //ensure that the food isn't on the snake
    if (snakeArr.length > 0)
    {
        snakeArr.forEach(element => {
            //if it isn't, restart the function
            if(foodPos.equals(element.pos, 2))
                placeFood()
        })
    }

    //update the food dom element to its new position and make sure it is visible
    const dom = document.getElementById(`food`)
    dom.style.left = foodPos.x+"px"
    dom.style.top = foodPos.y+"px"
    dom.style.display = "inline-flex"
}

//this is the main thread containing the game
async function gameLoop() {

    while (gameRunning)
    {
        if(!gamePaused)
        {
            document.querySelector("p").innerText = ""

            //update the snake's head's position according to the direction it is going
            changedDir = false
            lastPos = new Vector2(snakeHeadPos.x, snakeHeadPos.y)
            switch (snakeHeadDir)
            {
                case "up":
                    snakeHeadPos.y -= 20
                    break;
                case "down":
                    snakeHeadPos.y += 20
                    break;
                case "left":
                    snakeHeadPos.x -= 20
                    break;
                case "right":
                    snakeHeadPos.x += 20
                    break;
            }
            setSnakePosition()

        //if the game is paused, make sure the player understands it is paused and not frozen
        } else
            document.querySelector("p").innerText = "Press on the game board to continue."

        //the game "framerate" can be changed at any time
        await new Promise(resolve => setTimeout( () => resolve(), speed))
    }

    //when the game stops
    music.pause()
    music.currentTime = 0
    gameOver.play()
}

//update the snake position every game "frame"
function setSnakePosition() {

    //this sets the snake's head to its new position
    const snakehead = document.getElementById("s_0")
    snakehead.style.left = snakeHeadPos.x+"px"
    snakehead.style.top = snakeHeadPos.y+"px"
    snakehead.style.display = "inline-flex"

    testClash()

    //update the snake's body, every bit to the last position of the previous bit
    if(snakeArr.length > 0)
    {
        snakeArr.forEach(element => {
            const currentPos = element.pos
            element.pos = lastPos
    
            const dom = document.getElementById(`s_${element.id}`)
            dom.style.left = element.pos.x+"px"
            dom.style.top = element.pos.y+"px"
            dom.style.display = "inline-flex"
    
            lastPos = currentPos
        })
    }

    testFood()
    
}

//check for game over
function testClash () {

    //if the snake hits the border - game over
    if (!snakeTwoRules)
        if (snakeHeadPos.x - gameroomPos.left <= 0
            || (gameroomPos.left + gameroomPos.width) - snakeHeadPos.x <= 15
            || snakeHeadPos.y - gameroomPos.top <= 0 
            || (gameroomPos.top + gameroomPos.height) - snakeHeadPos.y <= 20)
                gameRunning = false
    
    //if the snake hits the border - it goes through
    if (snakeTwoRules)
    {
        if(snakeHeadPos.x - gameroomPos.left <= 11)
        snakeHeadPos.x += gameroomPos.width

        if((gameroomPos.left + gameroomPos.width) - snakeHeadPos.x <= 11)
            snakeHeadPos.x -= gameroomPos.width

        if(snakeHeadPos.y - gameroomPos.top <= 11)
            snakeHeadPos.y += gameroomPos.height

        if((gameroomPos.top + gameroomPos.height) - snakeHeadPos.y <= 11)
            snakeHeadPos.y -= gameroomPos.height
    }

    //if the snake is long enough to hit itself, check if it does, and game over of course
    if(snakeArr.length <= 3)
        return

    snakeArr.forEach(element => {
        if(snakeHeadPos.equals(element.pos))
            gameRunning = false
    })
}

//create a new bit of snake
function growSnake() {

    let lastBit

    //if the last bit is the snake's head, create a fake last bit with fake data,
    //otherwise, use the last bit's data
    if(snakeArr.length > 0)
        lastBit = snakeArr[snakeArr.length-1]
    else
        lastBit = new snakeBit(0, new Vector2(0, 0))

    snakeArr.push(new snakeBit(lastBit.id + 1, lastBit.pos))

    //clone the snake's head, but change the body's color
    const newBit = document.getElementById("s_0").cloneNode()
    newBit.id = `s_${lastBit.id+1}`
    newBit.classList.add("snake")
    newBit.classList.add("snake-body")
    newBit.style.left = 0+"px"
    newBit.style.top = 0+"px"
    document.querySelector(".game-room").append(newBit)
}

//check if the snake has eaten a food
function testFood() {
    if(!snakeHeadPos.equals(foodPos))
        return

    powerUp.play()
    growSnake()
    placeFood()
}

//called every time a button is pressed
function changeDir(e) {
    //only one direction change is allowed per "frame"
    if(changedDir)
        return

    //the extra checks are to simulate a keypress and not a keydown
    //verify that the snake is allowed to turn to the requested direction
    switch(e.key)
    {
        case "ArrowDown":
            if(pressed.down)
                return

            pressed.down = true

            if (snakeHeadDir == "left" || snakeHeadDir == "right")
                snakeHeadDir = "down"

            break
        case "ArrowUp":
            if(pressed.up)
                return

            pressed.up = true

            if (snakeHeadDir == "left" || snakeHeadDir == "right")
                snakeHeadDir = "up"

            break
        case "ArrowLeft":
            if(pressed.left)
                return

            pressed.left = true

            if (snakeHeadDir == "up" || snakeHeadDir == "down")
                snakeHeadDir = "left"

            break
        case "ArrowRight":
            if(pressed.right)
                return

            pressed.right = true

            if (snakeHeadDir == "up" || snakeHeadDir == "down")
                snakeHeadDir = "right"

            break
    }
    changedDir = true
}

//called every time a button is released
function releaseKey(e) {
    switch(e.key)
    {
        case "ArrowDown":
            pressed.down = false
            break
        case "ArrowUp":
            pressed.up = false
            break
        case "ArrowLeft":
            pressed.left = false
            break
        case "ArrowRight":
            pressed.right = false
            break
    }
}

//if the player clicks anywhere on the page that isnt a button, the game freezes
function freezeGame(e) {

    if(e.path[0] == document.querySelector('.game-room'))
        gamePaused = false
    //buttons do not freeze the game, nor do they unfreeze it
    else if(!e.path[0].classList.contains("btn"))
        gamePaused = true
}

//self explanatory
function changeSpeed(inc) {

    if (inc && speed > 50)
        speed -= 10
    else if (!inc && speed < 150)
        speed += 10
        
}

//set snake 2 rules active/inactive
function changeRules(event) {
    snakeTwoRules = !snakeTwoRules
    event.path[0].classList.toggle("red")
}

document.addEventListener('keydown', changeDir)
//arrow keys cannot be detected with keypress in most browsers, only keydown, so I have to make sure they are only pressed once
document.addEventListener('keyup', releaseKey)

document.addEventListener('mousedown', freezeGame)