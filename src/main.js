const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#2d5a27",
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 0},
            debug: false
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config)

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);

    const scene = game.scene.getScene('GameScene');
    if(scene && scene.nightOverlay){
        scene.nightOverlay.setSize(window.innerWidth * 3, window.innerHeight * 3);
        scene.statsBg.setPosition(window.innerWidth / 2, 30);
        scene.healthBarBg.setPosition(window.innerWidth / 2 - 140, 30);
        scene.healthBar.setPosition(window.innerWidth / 2 - 140, 30);
        scene.healthLabel.setPosition(window.innerWidth / 2 - 200, 23);
        scene.hungerBarBg.setPosition(window.innerWidth / 2, 30);
        scene.hungerBar.setPosition(window.innerWidth / 2, 30);
        scene.hungerLabel.setPosition(window.innerWidth / 2 - 60, 23);
        scene.thirstBarBg.setPosition(window.innerWidth / 2 + 140, 30);
        scene.thirstBar.setPosition(window.innerWidth / 2 + 140, 30);
        scene.thirstLabel.setPosition(window.innerWidth / 2 + 80, 23);
        scene.uiContainer.getAt(0).setPosition(window.innerWidth / 2, window.innerHeight - 40);
        scene.woodText.setPosition(window.innerWidth / 2 - 150, window.innerHeight - 52);
        scene.stoneText.setPosition(window.innerWidth / 2 - 20, window.innerHeight - 52);
        scene.foodText.setPosition(window.innerWidth / 2 + 110, window.innerHeight - 52);
        const mapSize = 150;
        const padding = 10;
        scene.minimapX = window.innerWidth - mapSize - padding;
        scene.minimapY = window.innerHeight - mapSize - padding;
        scene.minimapBg.setPosition(
            scene.minimapX + mapSize / 2,
            scene.minimapY + mapSize / 2
        );
    }
});