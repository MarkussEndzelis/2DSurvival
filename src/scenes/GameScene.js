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
        this.input.on('pointerdown', (pointer) => {
            if(this.buildMode){
                this.placeWall(pointer);
            }else if(this.deleteMode){
                this.breakWall(pointer);
            }else{
                this.handleAttack(pointer);
            }
        });
        this.createUI();
        this.createStatBars();

        this.dayDuration = 300000;
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
        this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.bKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
        this.vKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);
        this.buildMode = false;
        this.deleteMode = false;
        this.walls = this.physics.add.staticGroup();
        this.physics.add.collider(this.player, this.walls);
        this.buildModeText = this.add.text(
            window.innerWidth / 2, 60, '',
            {fontSize: '14px', fill: '#ffff00'}
        ).setScrollFactor(0).setDepth(11).setOrigin(0.5);
        this.campfires = [];
        this.inventory.spear = 0;
        this.spearDurability = 0;
        this.craftingOpen = false;
        this.craftingUI = null;

        this.stats = {
            health: 100,
            hunger: 100,
            thirst: 100
        };
        this.lastStatTick = 0;
        this.respawnQueue = [];
        this.lastRespawnTick = 0;
        this.wolfKills = 0;
        this.wallsBuilt = 0;
        this.bossSpawned = false;
        this.gameWon = false;
        this.currentQuest = 0;
        this.quests = [
            {desc: 'Gather 30 wood + 20 stone', done: false, check: () => this.inventory.wood >= 30 && this.inventory.stone >= 20, reward: () => {this.inventory.food += 10; this.updateUI();}},
            {desc: 'Survive 7 nights', done: false, check: () => Math.floor((this.time.now - this.dayStart) / this.dayDuration) >= 7, reward: () => {this.spearDurability += 50; }},
            {desc: 'Kill 15 wolves', done: false, check: () => this.wolfKills >= 15, reward: () => {this.inventory.wood += 20; this.inventory.stone += 10; this.updateUI(); }},
            {desc: 'Build 20 walls', done: false, check: () => this.wallsBuilt >= 20, reward: () => {this.stats.health = 100; this.stats.hunger = 100; this.stats.thirst = 100; this.updateStatBars();}},
            {desc: 'Survive 15 nights', done: false, check: () => Math.floor((this.time.now - this.dayStart) / this.dayDuration) >= 15, reward: () => {this.spawnBoss();}},
            {desc: 'Kill the Boss', done: false, check: () => this.bossDefeated === true, reward: () => {this.showWinScreen();}},
        ];
        this.createQuestUI();
        this.createMinimap();
    }
    createMinimap(){
        const mapSize = 150;
        const padding = 10;
        const x = window.innerWidth - mapSize - padding;
        const y = window.innerHeight - mapSize - padding;

        this.minimapBg = this.add.rectangle(
            x + mapSize / 2, y + mapSize / 2,
            mapSize, mapSize, 0x000000, 0.6
        ).setScrollFactor(0).setDepth(15);

        this.minimapGraphics = this.add.graphics().setScrollFactor(0).setDepth(16);

        this.minimapDot = this.add.rectangle(
            x, y, 4, 4, 0xffff00
        ).setScrollFactor(0).setDepth(17);

        this.minimapX = x;
        this.minimapY = y;
        this.minimapSize = mapSize;
    }
    updateMinimap(){
        const g = this.minimapGraphics;
        const mx = this.minimapX;
        const my = this.minimapY;
        const ms = this.minimapSize;
        const scaleX = ms / this.worldWidth;
        const scaleY = ms / this.worldHeight;

        g.clear();

        g.fillStyle(0x1a6b9a, 0.8);
        this.waterBodies.forEach(lake => {
            g.fillCircle(
                mx + lake.x * scaleX,
                my + lake.y * scaleY,
                lake.r * scaleX
            )
        });
        
        this.animals.forEach(animal => {
            if(!animal.active){
                return;
            }
            g.fillStyle(animal.type === 'wolf' ? 0xff4444 : 0xffffff, 1);
            g.fillRect(
                mx + animal.x * scaleX - 1,
                my + animal.y * scaleY - 1,
                2, 2
            );
        });

        this.minimapDot.x = mx + this.player.x * scaleX;
        this.minimapDot.y = my + this.player.y * scaleY;
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
        this.playerGraphics = this.add.graphics();

        this.player = this.add.rectangle(
            this.worldWidth / 2,
            this.worldHeight / 2,
            24, 32, 
            0x000000, 0
        );
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.drawPlayer();
    }
    drawPlayer(){
        const g = this.playerGraphics;
        g.clear();

        g.fillStyle(0x5c3d1e);
        g.fillTriangle(-12, 16, 12, 16, 0, -4);

        g.fillStyle(0x6b4a26);
        g.fillEllipse(0, 2, 28, 10);

        g.fillStyle(0x5c3d1e);
        g.fillCircle(0, -8, 10);

        g.fillStyle("0xd4956a");
        g.fillCircle(0, -8, 7);

        g.fillStyle(0x222222);
        g.fillCircle(-3, -9, 1.5);
        g.fillCircle(3, -9, 1.5);

        g.fillStyle(0x8b5e3c);
        g.fillRect(-2, -5, 4, 1);

        g.fillStyle(0x3b2a1a);
        g.fillRect(-9, 12, 7, 5);
        g.fillRect(2, 12, 7, 5);
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
            body.setData('leaves', leaves);
            body.setData('trunk', trunk);
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
        this.add.text(
            20, window.innerHeight - 120,
            '[E] Chop tree / Mine rock / Pick food / Drink water\n[F] Eat food\n[C] Open crafting\n[B] Place campfire (3 wood) - heals at night\n[Click] Attack animal\n[V] Cycle build/delete/normal mode',
            {fontSize: '13px', fill: '#aaaaaa'}
        ).setScrollFactor(0).setDepth(10);

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
                    body.getData('leaves').destroy();
                    body.getData('trunk').destroy();
                    body.destroy();
                    this.respawnQueue.push({type: 'tree', x: body.x, y: body.y, time: this.time.now + 30000});
                    this.inventory.wood += 1;
                    this.updateUI();
                }
            });

            this.rocks.getChildren().forEach(body => {
                const dx = this.player.x - body.x;
                const dy = this.player.y - body.y;
                if(Math.sqrt(dx * dx + dy * dy) < 60){
                    body.destroy();
                    this.respawnQueue.push({type: 'rock', x: body.x, y: body.y, time: this.time.now + 45000});
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
                    this.respawnQueue.push({type: 'food', x: food.x, y: food.y, time: this.time.now + 20000});
                    this.foodItems.splice(index, 1);
                    this.inventory.food += 1;
                    this.updateUI();
                }
            });
            this.walls.getChildren().forEach(wall => {
                const dx = this.player.x - wall.x;
                const dy = this.player.y - wall.y;
                if(Math.sqrt(dx*dx + dy*dy) < 60){
                    wall.destroy();
                    this.inventory.wood += 1;
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
            if(now - this.lastRespawnTick > 5000){
                this.lastRespawnTick = now;
                this.processRespawns();
            }
        }

        if(Phaser.Input.Keyboard.JustDown(this.fKey)){
            if(this.inventory.food > 0){
                this.inventory.food -= 1;
                this.stats.hunger = Math.min(100, this.stats.hunger + 30);
                this.updateUI();
                this.updateStatBars();
            }
        }
        if(Phaser.Input.Keyboard.JustDown(this.cKey)){
            this.toggleCrafting();
        }
        if(this.craftingOpen && this.oneKey && Phaser.Input.Keyboard.JustDown(this.oneKey)){
            if(this.inventory.wood >= 3 && this.inventory.stone >= 2){
                this.inventory.wood -= 3;
                this.inventory.stone -= 2;
                this.spearDurability += 20;
                this.updateCraftingText();
            }
        }
        if(Phaser.Input.Keyboard.JustDown(this.bKey)){
            if(this.inventory.wood >= 3){
                this.inventory.wood -= 3;
                this.placeCampfire(this.player.x, this.player.y);
                this.updateUI();
            }
        }
        if(Phaser.Input.Keyboard.JustDown(this.vKey)){
            if(!this.buildMode && !this.deleteMode){
                this.buildMode = true;
                this.deleteMode = false;
                this.buildModeText.setText('BUILD MODE - Click to place wall (2 wood)');
            }else if(this.buildMode){
                this.buildMode = false;
                this.deleteMode = true;
                this.buildModeText.setText('DELETE MODE - Click a wall to remove it');
            }else{
                this.buildMode = false;
                this.deleteMode = false;
                this.buildModeText.setText('');
            }
        }
        this.campfires.forEach(fire => {
            if(!fire.active){
                return;
            }
            const dx = this.player.x - fire.x;
            const dy = this.player.y - fire.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 80){
                const pct = (this.time.now - this.dayStart) % this.dayDuration / this.dayDuration;
                const isNight = pct >= 0.5;
                if(isNight && this.stats.health < 100){
                    this.stats.health = Math.min(100, this.stats.health + 0.05);
                    this.updateStatBars();
                }
            }
        });
        this.checkQuests();
        if(this.boss){
            this.updateBoss();
        }
        this.updateAnimals();
        this.playerGraphics.x = this.player.x;
        this.playerGraphics.y = this.player.y;
        this.playerGraphics.setDepth(3);
        this.updateCampfires();
        this.updateMinimap();
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


    breakWall(pointer){
        const worldX = pointer.x + this.cameras.main.scrollX;
        const worldY = pointer.y + this.cameras.main.scrollY;

        const children = this.walls.getChildren();
        for(let i = children.length - 1; i >= 0; i--){
            const wall = children[i];
            const dx = worldX - wall.x;
            const dy = worldY - wall.y;
            if(Math.abs(dx) < 16 && Math.abs(dy) < 16){
                wall.destroy();
                this.inventory.wood += 1;
                this.updateUI();
                this.walls.refresh();
                break;
            }
        }
    }
    updateStatBars(){
        this.healthBar.width = (this.stats.health / 100) * 120;
        this.hungerBar.width = (this.stats.hunger / 100) * 120;
        this.thirstBar.width = (this.stats.thirst / 100) * 120;
        if(this.stats.health <= 0){
            this.showDeathScreen();
        }
    }

    placeWall(pointer){
        if(this.inventory.wood < 2){
            return;
        }

        const worldX = Math.round((pointer.x + this.cameras.main.scrollX) / 32) * 32;
        const worldY = Math.round((pointer.y + this.cameras.main.scrollY) / 32) * 32;

        this.inventory.wood -= 2;
        this.updateUI();

        const wall = this.add.rectangle(worldX, worldY, 32, 32, 0x8b6914);

        this.walls.add(wall);
        this.wallsBuilt++;

        this.walls.refresh();
    }

    processRespawns(){
        const ready = this.respawnQueue.filter(r => this.time.now >= r.time);
        const remaining = this.respawnQueue.filter(r => this.time.now < r.time);
        this.respawnQueue = remaining;

        ready.forEach(r => {
            if(r.type === 'tree'){
                const x = r.x;
                const y = r.y;
                const leaves = this.add.circle(x, y - 20, 22, 0x2d7a2d);
                const trunk = this.add.rectangle(x, y + 5, 10, 16, 0x5c3d1e);
                const body = this.add.rectangle(x, y, 10, 10, 0x000000, 0);
                body.setData('leaves', leaves);
                body.setData('trunk', trunk);
                this.trees.add(body);
                this.physics.add.existing(body, true);
            }
            if(r.type === 'rock'){
                const rock = this.add.circle(r.x, r.y, 12, 0x888888);
                this.rocks.add(rock);
                this.rocks.refresh();
            }
            if(r.type === 'food'){
                const foodTypes = [
                    {name: 'apple', color: 0xff3333},
                    {name: 'banana', color: 0xffee00},
                    {name: 'berries', color: 0x9b30ff},
                    {name: 'potato', color: 0xc8a96e},
                ];
                const type = Phaser.Math.RND.pick(foodTypes);
                const sprite = this.add.circle(r.x, r.y, 7, type.color);
                sprite.setData('type', type.name);
                this.foodItems.push(sprite);
            }
        });
    }
    showDeathScreen(){
        this.physics.pause();
        this.animals.forEach(a => a.active = false);

        const overlay = this.add.rectangle(
            window.innerWidth / 2, window.innerHeight / 2,
            window.innerWidth, window.innerHeight, 
            0x000000, 0.85
        ).setScrollFactor(0).setDepth(50);

        this.add.text(
            window.innerWidth / 2, window.innerHeight / 2 - 80,
            'YOU DIED',
            {fontSize: '48px', fill: '#ff3333', fontStyle: 'bold'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        const dayCount = Math.floor((this.time.now - this.dayStart) / this.dayDuration)
        const killed = this.animals.filter(a => !a.active).length;

        this.add.text(
            window.innerWidth / 2, window.innerHeight / 2,
            `Days survived: ${dayCount}\nAnimals killed: ${killed}`,
            {fontSize: '20px', fill: '#ffffff', align: 'center'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        this.add.text(
            window.innerWidth / 2, window.innerHeight / 2 + 100,
            'Press R to restart',
            {fontSize: '16px', fill: '#aaaaaa'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart();
        });
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
        if(this.spearDurability <= 0){
            return;
        }

        const worldX = pointer.x + this.cameras.main.scrollX;
        const worldY = pointer.y + this.cameras.main.scrollY;

        const px = this.player.x;
        const py = this.player.y;
        if(Math.sqrt((worldX-px)**2 + (worldY-py)**2) > 120){
            return;
        }

        this.animals.forEach(animal => {
            if(!animal.active){
                return;
            }
            const dx = worldX - animal.x;
            const dy = worldY - animal.y;
            if(Math.sqrt(dx*dx + dy*dy) < 25){
                animal.hp -= 25;
                this.spearDurability--;
                this.updateCraftingText();
                if(animal.hp <= 0){
                    animal.gfx.destroy();
                    animal.active = false;
                    if(animal.type === 'rabbit'){
                        this.inventory.food += 2;
                    }
                    if(animal.type === 'wolf'){
                        this.inventory.food += 4;
                        if(animal.type === 'wolf'){
                            this.wolfKills++;
                        }
                    }
                    this.updateUI();
                }
            }
        });

        if(this.boss && this.boss.active && this.spearDurability > 0){
            const dx = worldX - this.boss.x;
            const dy = worldY - this.boss.y;
            if(Math.sqrt(dx*dx + dy*dy) < 40){
                this.boss.hp -= 25;
                this.spearDurability--;
                if(this.boss.hp <= 0){
                    this.boss.gfx.destroy();
                    this.boss.active = false;
                    this.bossDefeated = true;
                    this.bossHpBg.destroy();
                    this.bossHpBar.destroy();
                    this.bossLabel.destroy();
                }
            }
        }
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
    toggleCrafting(){
        this.craftingOpen = !this.craftingOpen;
        if(this.craftingOpen){
            this.craftingUI = this.add.container(0, 0).setScrollFactor(0).setDepth(20);

            const bg = this.add.rectangle(
                window.innerWidth / 2, window.innerHeight / 2,
                300, 200, 0x000000, 0.85
            );
            const title = this.add.text(
                window.innerWidth / 2 - 120, window.innerHeight / 2 - 80,
                '--- CRAFTING ---', {fontSize: '16px', fill: '#ffffff'}
            );
            this.spearRecipeText = this.add.text(
                window.innerWidth / 2 - 120, window.innerHeight / 2 - 40,
                this.getSpearText(),
                {fontSize: '13px', fill: '#cccccc'}
            );
            const hint = this.add.text(
                window.innerWidth / 2 - 120, window.innerHeight / 2 + 20,
                'Press [1] to craft spear\nPress [c] to close',
                {fontSize: '12px', fill: '#888888'}
            );
            this.craftingUI.add([bg, title, this.spearRecipeText, hint]);
        }else{
            if(this.craftingUI){
                this.craftingUI.destroy();
                this.craftingUI = null;
            }
        }
    }
    getSpearText(){
        const canCraft = this.inventory.wood >= 3 && this.inventory.stone >= 2;
        const durText = this.spearDurability > 0 ? ` (durability: ${this.spearDurability})` : '';
        return `[1] Spear${durText}\n   3 wood + 2 stone\n   ${canCraft ? '✓ Can craft' : '✗ Not enough resources'}`;
    }

    placeCampfire(x, y){
        const g = this.add.graphics();
        this.drawCampfire(g);
        g.x = x;
        g.y = y;

        const glow = this.add.circle(x, y, 80, 0xff6600, 0.08).setDepth(4);

        this.campfires.push({gfx: g, glow, x, y, active: true, flicker: 0});
    }
    drawCampfire(g){
        g.clear();

        g.fillStyle(0x5c3d1e);
        g.fillRect(-10, 2, 20, 5);
        g.fillRect(-7, -2, 5, 8);
        g.fillRect(2, -2, 5, 8);

        g.fillStyle(0xff6600);
        g.fillTriangle(-6, 2, 6, 2, 0, -14);
        g.fillStyle(0xffaa00);
        g.fillTriangle(-4, 2, 4, 2, 0, -9);
        g.fillStyle(0xffff00);
        g.fillTriangle(-2, 2, 2, 2, 0, -5);
    }
    updateCampfires(){
        this.campfires.forEach(fire => {
            if(!fire.active){
                return;
            }
            fire.flicker += 0.1;
            const scale = 1 + Math.sin(fire.flicker) * 0.1;
            fire.gfx.setScale(1, scale);
            fire.glow.setAlpha(0.06 + Math.sin(fire.flicker * 1.3) * 0.03);
        });
    }

    updateCraftingText(){
        if(this.craftingOpen && this.spearRecipeText){
            this.spearRecipeText.setText(this.getSpearText());
        }
        this.updateUI();
    }

    createQuestUI(){
        this.questbg = this.add.rectangle(
            window.innerWidth - 160, 120, 280, 80, 0x000000, 0.7
        ).setScrollFactor(0).setDepth(11);

        this.questTitle = this.add.text(
            window.innerWidth - 290, 90, 'QUEST:', {fontSize: '13px', fill: '#ffff00'}
        ).setScrollFactor(0).setDepth(12);

        this.questText = this.add.text(
            window.innerWidth - 290, 108, '', {fontSize: '12px', fill: '#ffffff', wordWrap: {width: 260}}
        ).setScrollFactor(0).setDepth(12);

        this.updateQuestUI();
    }
    updateQuestUI(){
        if(this.currentqUEST >= this.quests.length){
            return;
        }
        const q = this.quests[this.currentQuest];
        this.questText.setText(q.desc);
    }

    checkQuests(){
        if(this.currentQuest >= this.quests.length){
            return;
        }
        const q = this.quests[this.currentQuest];
        if(!q.done && q.check()){
            q.done = true;
            q.reward();
            this.currentQuest++;
            this.showQuestComplete();
            this.updateQuestUI(); 
        }
    }

    showQuestComplete(){
        const txt = this.add.text(
            window.innerWidth / 2, window.innerHeight / 2 - 150, 'QUEST COMPLETE!', {fontSize: '24px', fill: '#00ff00', fontStyle: 'bold'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        this.time.delayedCall(2000, () => txt.destroy());
    }

    spawnBoss(){
        const g = this.add.graphics();
        const draw = (gfx) => {
            gfx.clear();

            gfx.fillStyle(0x4a3728);
            gfx.fillEllipse(0, 5, 48, 32);

            gfx.fillStyle(0x5a4535);
            gfx.fillCircle(0, -14, 18);

            gfx.fillStyle(0x4a3728);
            gfx.fillCircle(-14, -26, 7);
            gfx.fillCircle(14, -26, 7);

            gfx.fillStyle(0xff0000);
            gfx.fillCircle(-7, -16, 4);
            gfx.fillCircle(7, -16, 4);
            gfx.fillStyle(0x000000);
            gfx.fillCircle(-7, -16, 2);
            gfx.fillCircle(7, -16, 2);

            gfx.fillStyle(0x3a2518);
            gfx.fillEllipse(0, -8, 16, 10);
            gfx.fillStyle(0x000000);
            gfx.fillCircle(-3, -8, 2);
            gfx.fillCircle(3, -8, 2);

            gfx.fillStyle(0x4a3728);
            gfx.fillRect(-18, 16, 10, 14);
            gfx.fillRect(-6, 16, 10, 14);
            gfx.fillRect(6, 16, 10, 14);
        };
        draw(g);
        g.x = this.player.x + 300;
        g.y = this.player.y;

        this.boss = {
            gfx: g,
            x: g.x, y: g.y,
            hp: 500,
            maxHp: 500,
            speed: 80,
            attackCooldown: 0,
            active: true,
            draw
        };

        this.bossHpBg = this.add.rectangle(window.innerWidth / 2, window.innerHeight - 80, 300, 20, 0x550000).setScrollFactor(0).setDepth(11);
        this.bossHpBar = this.add.rectangle(window.innerWidth / 2, window.innerHeight - 80, 300, 20, 0xff0000).setScrollFactor(0).setDepth(12);
        this.bossLabel = this.add.text(window.innerWidth / 2, window.innerHeight - 100, 'BOSS', {fontSize: '14px', fill: '#ff0000'}).setScrollFactor(0).setDepth(12).setOrigin(0.5);
    
        const warn = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'THE BOSS HAS APPEARED!',
            {fontSize: '28px', fill: '#ff0000', fontStyle: 'bold'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);
        this.time.delayedCall(3000, () => warn.destroy());
    }

    updateBoss(){
        if(!this.boss || !this.boss.active){
            return;
        }

        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const delta = this.game.loop.delta / 1000;
        const angle = Math.atan2(dy, dx);

        this.boss.x += Math.cos(angle) * this.boss.speed * delta;
        this.boss.y += Math.sin(angle) * this.boss.speed * delta;

        if(dist < 50 && this.time.now > this.boss.attackCooldown){
            this.stats.health = Math.max(0, this.stats.health - 20);
            this.updateStatBars();
            this.boss.attackCooldown = this.time.now + 1500;
        }

        this.boss.gfx.x = this.boss.x;
        this.boss.gfx.y = this.boss.y;
        this.boss.draw(this.boss.gfx);

        if(this.bossHpbar){
            this.bossHpbar.width = (this.boss.hp / this.boss.maxHp) * 300;
        }
    }

    showWinScreen(){
        this.physics.pause();
        const overlay = this.add.rectangle(
            window.innerWidth / 2, window.innerHeight / 2,
            window.innerWidth, window.innerHeight, 0x000000, 0.85
        ).setScrollFactor(0).setDepth(50);
        
        this.add.text(
            window.innerWidth / 2, window.innerHeight / 2 - 80,
            'YOU WIN!', {fontSize: '48px', fill: '#ffff00', fontStyle: 'bold'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        const dayCount = Math.floor((this.time.now - this.dayStart) / this.dayDuration);
        this.add.text(
            window.innerWidth / 2, window.innerHeight / 2,
            'Days survived: ${dayCount}\nWolves killed: ${this.wolfKills}',
            {fontSize: '20px', fill: '#ffffff', align: 'center'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        this.add.text(
            window.innerWidth / 2, window.innerHeight / 2 + 100,
            'Press R to play again', {fontSize: '16px', fill: '#aaaaaa'}
        ).setScrollFactor(0).setDepth(51).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }
}