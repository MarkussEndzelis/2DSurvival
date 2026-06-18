class GameScene extends Phaser.Scene {
    constructor(){
        super({key: 'GameScene'});
    }

    preload(){

    }

    create(){
        this.worldWidth = 8000;
        this.worldHeight = 8000;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.createGround();

        this.createPlayer();

        
        this.createWater();
        this.createTrees();
        this.createRocks();
        this.physics.add.collider(this.player, this.trees);
        this.physics.add.collider(this.player, this.rocks);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.inventory = {wood: 0, stone: 0, food: 0};
        this.createFood();
        this.createUI();
    }
    createGround(){
        this.groundGraphics = this.add.graphics();

        for(let x = 0; x < this.worldWidth; x += 64){
            for(let y = 0; y < this.worldHeight; y += 64){
                const shade = Phaser.Math.Between(0, 10);
                const green = 80 + shade;
                this.groundGraphics.fillStyle(
                    Phaser.Display.Color.GetColor(34 + shade, green, 34 + shade)
                );
                this.groundGraphics.fillRect(x, y, 64, 64);
            }
        }
    }
    createPlayer(){
        this.player = this.add.rectangle(
            this.worldWidth / 2,
            this.worldHeight / 2,
            32, 32,
            0xe8c96d
        );
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
    }
    
    createTrees(){
        this.trees = this.physics.add.staticGroup();

        for (let i = 0; i < 400; i++){
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);

            const nearWater = this.waterBodies.some(lake => {
                const dx = x - lake.x;
                const dy = y - lake.y;
                return Math.sqrt(dx * dx + dy * dy) < lake.r + 40;
            });
            if (nearWater){
                continue;
            }
            const leaves = this.add.circle(x, y - 20, 22, 0x2d7a2d);
            const trunk = this.add.rectangle(x, y + 5, 10, 16, 0x5c3d1e);
            const body = this.add.rectangle(x, y, 10, 10, 0x000000, 0);
            this.trees.add(body);
            this.physics.add.existing(body, true);
        }
    }

    createFood(){
        this.foodItems = [];
        const foodTypes = [
            {name: 'apple', color: 0xff3333},
            {name: 'banana', color: 0xffee00},
            {name: 'berries', color: 0x9b30ff},
            {name: 'potato', color: 0xc8a96e},
        ];

        for (let i = 0; i < 150; i++){
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            const type = Phaser.Math.RND.pick(foodTypes);

            const nearWater = this.waterBodies.some(lake => {
                const dx = x - lake.x;
                const dy = y - lake.y;
                return Math.sqrt(dx * dx + dy * dy) < lake.r + 40;
            });
            if(nearWater){
                continue;
            }

            const sprite = this.add.circle(x, y, 7, type.color);
            sprite.setData('type', type.name);
            this.foodItems.push(sprite);
        }
    }

    createUI(){
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(10);

        const barBg = this.add.rectangle(
            window.innerWidth / 2, window.innerHeight - 40, 400, 50, 0x000000, 0.6
        );
        this.uiContainer.add(barBg);

        this.woodText = this.add.text(
            window.innerWidth / 2 - 150, window.innerHeight - 52,
            '🪵Wood: 0', {fontSize: '16px', fill: '#ffffff'}
        );
        this.stoneText = this.add.text(
            window.innerWidth / 2 - 20, window.innerHeight - 52,
            '🪨Stone: 0', {fontSize: '16px', fill: '#ffffff'}
        );
        this.foodText = this.add.text(
            window.innerWidth / 2 + 110, window.innerHeight - 52,
            '🍎Food: 0', {fontSize: '16px', fill: '#ffffff'}
        );

        this.uiContainer.add([this.woodText, this.stoneText, this.foodText]);
    }

    updateUI(){
        this.woodText.setText(`🪵Wood: ${this.inventory.wood}`);
        this.stoneText.setText(`🪨Stone: ${this.inventory.stone}`);
        this.foodText.setText(`🍎Food: ${this.inventory.food}`);
    }

    createRocks(){
        this.rocks = this.physics.add.staticGroup();
        for (let i = 0; i < 100; i++){
            const x = Phaser.Math.Between(50, this.worldWidth - 50);
            const y = Phaser.Math.Between(50, this.worldHeight - 50);
            const rock = this.add.circle(x, y, 12, 0x888888);
            this.rocks.add(rock);
            rock.setData('type', 'rock');
        }
    }

    createWater(){
        this.waterBodies = [];
        const lakes = [
            {x: 400, y: 400, r: 120},
            {x: 2800, y: 1200, r: 180},
            {x: 1600, y: 2600, r: 150},
            {x: 5000, y: 3000, r: 200},
            {x: 6500, y: 5000, r: 160},
            {x: 3000, y: 6000, r: 140},
        ];
        this.waterGraphics = this.add.graphics();
        this.waterGraphics.fillStyle(0x1a6b9a);

        lakes.forEach(lake => {
            this.waterGraphics.fillCircle(lake.x, lake.y, lake.r);
            this.waterBodies.push(lake);
        });
    }

    update(){
        const speed = 200;
        const body = this.player.body;

        body.setVelocity(0);

        if(this.cursors.left.isDown || this.wasd.left.isDown){
            body.setVelocityX(-speed);
        }else if (this.cursors.right.isDown || this.wasd.right.isDown){
            body.setVelocityX(speed);
        }

        if(this.cursors.up.isDown || this.wasd.up.isDown){
            body.setVelocityY(-speed);
        }else if(this.cursors.down.isDown || this.wasd.down.isDown){
            body.setVelocityY(speed);
        }

        this.waterBodies.forEach(lake => {
            const dx = this.player.x - lake.x;
            const dy = this.player.y - lake.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < lake.r + 20){
                const angle = Math.atan2(dy, dx);
                this.player.x = lake.x + Math.cos(angle) * (lake.r + 21);
                this.player.y = lake.y + Math.sin(angle) * (lake.r + 21);
            }
        });
        if (Phaser.Input.Keyboard.JustDown(this.eKey)){
            this.trees.getChildren().forEach(body => {
                const dx = this.player.x - body.x;
                const dy = this.player.y - body.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60){
                    body.destroy();
                    this.inventory.wood += 1;
                    this.updateUI();
                }
            });

            this.rocks.getChildren().forEach(body => {
                const dx = this.player.x - body.x;
                const dy = this.player.y - body.y;
                if(Math.sqrt(dx * dx + dy * dy) < 60){
                    body.destroy();
                    this.inventory.stone += 1;
                    this.updateUI();
                }
            });
            this.foodItems.forEach((food, index) => {
                if (!food.active){
                    return;
                }
                const dx = this.player.x - food.x;
                const dy = this.player.y - food.y;
                if(Math.sqrt(dx * dx + dy * dy) < 60){
                    food.destroy();
                    this.foodItems.splice(index, 1);
                    this.inventory.food += 1;
                    this.updateUI();
                }
            });
        }
    }
}