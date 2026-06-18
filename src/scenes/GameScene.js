class GameScene extends Phaser.Scene {
    constructor(){
        super({key: 'GameScene'});
    }

    preload(){

    }

    create(){
        this.worldWidth = 3200;
        this.worldHeight = 3200;

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.createGround();

        this.createPlayer();

        this.createTrees();
        this.createRocks();
        this.createWater();
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
        for (let i = 0; i < 200; i++){
            const x = Phaser.Math.Between(50, this.worldWidth - 50);
            const y = Phaser.Math.Between(50, this.worldheight - 50);
            const trunk = this.add.rectangle(x, y, 16, 16, 0x5c3d1e);
            const leaves = this.add.circle(x, y - 20, 24, 0x2d7a2d);
            this.trees.add(trunk);
            trunk.setData('type', 'tree');
        }
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
        this.waterGraphics = this.add.graphics();
        this.waterGraphics.fillStyle(0x1a6b9a);
        this.waterGraphics.fillCircle(400, 400, 120);
        this.waterGraphics.fillCircle(2800, 1200, 180);
        this.waterGraphics.fillCircle(1600, 2600, 150);
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
    }
}