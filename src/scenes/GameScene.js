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
        this.createAnimals();
        this.input.on('pointerdown', (pointer) => this.handleAttack(pointer));
        this.createUI();
        this.createStatBars();

        this.dayDuration = 60000;
        this.dayStart = this.time.now;

        this.nightOverlay = this.add.rectangle(
            0, 0,
            window.innerWidth * 2, window.innerHeight * 2,
            0x000022
        ).setScrollFactor(0).setDepth(5).setOrigin(0, 0).setAlpha(0);

        this.dayText = this.add.text(
            20, 20, 'Day 1 | Dawn',
            {fontSize: '14px', fill: '#ffffff'}
        ).setScrollFactor(0).setDepth(11);

        this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        this.stats = {
            health: 100,
            hunger: 100,
            thirst: 100
        };
        this.lastStatTick = 0;
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
            this.waterBodies.forEach(lake => {
                const dx = this.player.x - lake.x;
                const dy = this.player.y - lake.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if(dist < lake.r + 60){
                    this.stats.thirst = Math.min(100, this.stats.thirst + 40);
                    this.updateStatBars();
                }
            });
        }
        const now = this.time.now;
        if(now - this.lastStatTick > 2000){
            this.lastStatTick = now;
            this.stats.hunger = Math.max(0, this.stats.hunger - 1);
            this.stats.thirst = Math.max(0, this.stats.thirst - 1.5);
            if(this.stats.hunger === 0 || this.stats.thirst === 0){
                this.stats.health = Math.max(0, this.stats.health - 2);
            }
            this.updateStatBars();
        }

        if(Phaser.Input.Keyboard.JustDown(this.fKey)){
            if(this.inventory.food > 0){
                this.inventory.food -= 1;
                this.stats.hunger = Math.min(100, this.stats.hunger + 30);
                this.updateUI();
                this.updateStatBars();
            }
        }
        this.updateAnimals();
        this.updateDayNight();
    }
    createStatBars(){
        this.statsBg = this.add.rectangle(
            window.innerWidth / 2, 30, 420, 30, 0x000000, 0.6
        ).setScrollFactor(0).setDepth(10)

        this.healthBarBg = this.add.rectangle(
            window.innerWidth / 2 - 140, 30, 120, 14, 0x550000
        ).setScrollFactor(0).setDepth(11);

        this.healthBar = this.add.rectangle(
            window.innerWidth / 2 - 140, 30, 120, 14, 0xff3333
        ).setScrollFactor(0).setDepth(11);

        this.healthLabel = this.add.text(
            window.innerWidth / 2 - 200, 23, '❤️', {fontSize: '14px'}
        ).setScrollFactor(0).setDepth(11);

        this.hungerBarBg = this.add.rectangle(
            window.innerWidth / 2, 30, 120, 14, 0x554400
        ).setScrollFactor(0).setDepth(11);
        this.hungerBar = this.add.rectangle(
            window.innerWidth / 2, 30, 120, 14, 0xffaa00
        ).setScrollFactor(0).setDepth(11)
        this.hungerLabel = this.add.text(
            window.innerWidth / 2 - 60, 23, '🍖', {fontSize: '14px'} 
        ).setScrollFactor(0).setDepth(11);

        this.thirstBarBg = this.add.rectangle(
            window.innerWidth / 2 + 140, 30, 120, 14, 0x003355
        ).setScrollFactor(0).setDepth(11);
        this.thirstBar = this.add.rectangle(
            window.innerWidth / 2 + 140, 30, 120, 14, 0x3399ff
        ).setScrollFactor(0).setDepth(11);
        this.thirstLabel = this.add.text(
            window.innerWidth / 2 + 80, 23, '💧', {fontSize: '14px'}
        ).setScrollFactor(0).setDepth(11);
    }
    updateStatBars(){
        this.healthBar.width = (this.stats.health / 100) * 120;
        this.hungerBar.width = (this.stats.hunger / 100) * 120;
        this.thirstBar.width = (this.stats.thirst / 100) * 120;
    }
    updateDayNight(){
        const elapsed = (this.time.now - this.dayStart) % this.dayDuration;
        const pct = elapsed / this.dayDuration;

        let alpha = 0;
        let phase = '';
        let dayCount = Math.floor((this.time.now - this.dayStart) / this.dayDuration) + 1;

        if(pct < 0.25){
            phase = 'Dawn';
            alpha = 0.4 - (pct / 0.25) * 0.4;
        }else if(pct < 0.5){
            phase = 'Day';
            alpha = 0;
        }else if(pct < 0.75){
            phase = 'Dusk';
            alpha = ((pct - 0.5) / 0.25) * 0.7;
        }else{
            phase = 'Night';
            alpha = 0.7;
        }

        this.nightOverlay.setAlpha(alpha);
        this.dayText.setText(`Day ${dayCount} | ${phase}`);
    }
    createAnimals(){
        this.animals = [];
        const rabbitCount = Phaser.Math.Between(40, 70);
        const wolfCount = Phaser.Math.Between(15, 30);

        for(let i = 0; i < rabbitCount; i++){
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);
            this.animals.push(this.spawnRabbit(x, y));
        }
        for(let i = 0; i < wolfCount; i++){
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);
            this.animals.push(this.spawnWolf(x, y));
        }
    }

    spawnRabbit(x, y){
        const g = this.add.graphics();
        const draw = (gfx, flip) => {
        gfx.clear();
        gfx.fillStyle(0xd4c9a8);
        gfx.fillEllipse(0, 4, 14, 10);
        
        gfx.fillStyle(0xd4c9a8);
        gfx.fillCircle(0, -4, 6);

        gfx.fillStyle(0xd4c9a8);
        gfx.fillRect(-4, -12, 3, 8);

        gfx.fillStyle(0xd4c9a8);
        gfx.fillRect(1, -12, 3, 8);

        gfx.fillStyle(0xffaaaa);
        gfx.fillRect(-3, -11, 1, 6);

        gfx.fillStyle(0xffaaaa);
        gfx.fillRect(2, -11, 1, 6);

        gfx.fillStyle(0xff6666);
        gfx.fillCircle(flip ? -3 : 3, -5, 1.5);

        gfx.fillStyle(0xffffff);
        gfx.fillCircle(flip ? 6 : -6, 5, 3);

        gfx.fillStyle(0xc4b898);
        gfx.fillRect(-5, 7, 3, 5);
        gfx.fillRect(2, 7, 3, 5);
        };
        draw(g, false);
        g.x = x;
        g.y = y;

        return {
            gfx: g, x, y,
            type: 'rabbit',
            hp: 20,
            speed: Phaser.Math.Between(120, 180),
            fleeing: false,
            fleeTarget: null,
            flip: false,
            active: true,
            draw
        };
    }

    spawnWolf(x, y){
        const g = this.add.graphics();
        const draw = (gfx, flip) => {
            gfx.clear();
            gfx.fillStyle(0x7a7a8a);
            gfx.fillEllipse(0, 2, 22, 12);

            gfx.fillStyle(0x7a7a8a);
            gfx.fillRect(flip ? -10 : 4, -4, 6, 6);

            gfx.fillStyle(0x8a8a9a);
            gfx.fillEllipse(flip ? -14 : 14, -2, 12, 9);

            gfx.fillStyle(0x9a9aaa);
            gfx.fillEllipse(flip ? -19 : 19, 0, 7, 5);
            gfx.fillStyle(0x222222);
            gfx.fillCircle(flip ? -21 : 21, -1, 1);

            gfx.fillStyle(0xffcc00);
            gfx.fillCircle(flip ? -12 : 12, -4, 2);
            gfx.fillStyle(0x000000);
            gfx.fillCircle(flip ? -12 : 12, -4, 1);

            gfx.fillStyle(0x6a6a7a);
            gfx.fillTriangle(flip ? -11 : 9, -6, flip ? -14 : 12, -13, flip ? -8 : 16, -6);

            gfx.fillStyle(0x6a6a7a);
            gfx.fillRect(-8, 6, 4, 7);
            gfx.fillRect(-2, 6, 4, 7);
            gfx.fillRect(4, 6, 4, 7);

            gfx.fillStyle(0x5a5a6a);
            gfx.fillEllipse(flip ? 12 : -12, -2, 10, 5);
        };
        draw(g, false);
        g.x = x;
        g.y = y;

        return{
            gfx: g, x, y,
            type: 'wolf',
            hp: 60,
            speed: Phaser.Math.Between(90, 130),
            chasing: false,
            attackCooldown: 0,
            flip: false,
            active: true,
            draw
        };
    }
    handleAttack(pointer){
        const worldX = pointer.x + this.cameras.main.scrollX;
        const worldY = pointer.y + this.cameras.main.scrollY;

        this.animals.forEach(animal => {
            if(!animal.active){
                return;
            }
            const dx = worldX - animal.x;
            const dy = worldY - animal.y;
            if(Math.sqrt(dx*dx + dy*dy) < 25){
                animal.hp -= 25;
                if(animal.hp <= 0){
                    animal.gfx.destroy();
                    animal.active = false;
                    if(animal.type === 'rabbit'){
                        this.inventory.food += 2;
                        this.updateUI();
                    }
                }
            }
        });
    }

    updateAnimals(){
        const px = this.player.x;
        const py = this.player.y;
        const delta = this.game.loop.delta / 1000;

        this.animals.forEach(animal => {
            if(!animal.active){
                return;
            }
            if(animal.type === 'rabbit'){
                const dx = px - animal.x;
                const dy = py - animal.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 150){
                    const angle = Math.atan2(dy, dx);
                    animal.x -= Math.cos(angle) * animal.speed * delta;
                    animal.y -= Math.sin(angle) * animal.speed * delta;
                    animal.flip = dx > 0;
                }else{
                    if(!animal.wanderTimer || this.time.now > animal.wanderTimer){
                        animal.wanderAngle = Math.random() * Math.PI * 2;
                        animal.wanderTimer = this.time.now + Phaser.Math.Between(1500, 3500);
                    }
                    animal.x += Math.cos(animal.wanderAngle) * 30 * delta;
                    animal.y += Math.sin(animal.wanderAngle) * 30 * delta;
                }
            }
            if(animal.type === 'wolf'){
                const dx = px - animal.x;
                const dy = py - animal.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 300){
                    const angle = Math.atan2(dy, dx);
                    animal.x += Math.cos(angle) * animal.speed * delta;
                    animal.y += Math.sin(angle) * animal.speed * delta;
                    animal.flip = dx < 0;

                    if(dist < 35 && this.time.now > animal.attackCooldown){
                        this.stats.health = Math.max(0, this.stats.health - 8);
                        this.updateStatBars();
                        animal.attackCooldown = this.time.now + 1000;
                    }
                }else{
                    if(!animal.wanderTimer || this.time.now > animal.wanderTimer){
                        animal.wanderAngle = Math.random() * Math.PI * 2;
                        animal.wanderTimer = this.time.now + Phaser.Math.Between(2000, 4000);
                    }
                    animal.x += Math.cos(animal.wanderAngle) * 25 * delta;
                    animal.y += Math.sin(animal.wanderAngle) * 25 * delta;
                }
            }
            
            animal.x = Phaser.Math.Clamp(animal.x, 50, this.worldWidth - 50);
            animal.y = Phaser.Math.Clamp(animal.y, 50, this.worldHeight - 50);

            animal.gfx.x = animal.x;
            animal.gfx.y = animal.y;
            animal.draw(animal.gfx, animal.flip);
        });
    }
}