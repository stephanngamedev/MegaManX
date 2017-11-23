module MegaManX 
{
	enum ShootTypes 
	{
		Regular = 0,
		Medium = 1,
		Large = 2
	}
    export class Player extends Phaser.Sprite
	{
		
        //currentAnimation: Phaser.Animation;
        //nextAnimation: Phaser.Animation;
        frameVelocityX: number;
        frameVelocityY: number;
        onGround: boolean;
        canJump: boolean;
        jumped: boolean;
        wallSliding: boolean;
		teleporting: boolean;
		shootReleased: boolean;
		shotCharge: number;
		hasShot: boolean;
		lastChargeShotCallbackTime: number;
		animatedSprite: AnimatedSprite;
		chargeStartTime: number;
		currentShootStanceTimeout: number;
		healthBar: HealthBar;

		shootSounds: Phaser.Sound[];
		projectileDefinitions: ProjectileDefinition[];

        static airMovementSpeed: number = 15;
        static landMovementSpeed: number = 50;
        static maxSpeed: number = 150;
        static regularGravity: number = 7.5;
        static slidingGravity: number = 0.5;
        static teleportGravity: number = 150;
		static jumpVelocty: number = 150;

		static chargeDelayTime:number = 0.5;
		static shootStanceTimeout: number = 0.75;

		jumpKey: Phaser.Key;
		shootKey: Phaser.Key;

		chargeStartSound: Phaser.Sound;
		chargeLoopSound: Phaser.Sound;

        constructor(game: Phaser.Game, x: number, y: number)
        {
			super(game, x, y, null, 0);
			this.anchor.setTo(0.5, 0.5);
			this.chargeStartTime = 0.0;
			this.currentShootStanceTimeout = 0.0;
			this.lastChargeShotCallbackTime = 0.0;

			game.physics.enable(this, Phaser.Physics.ARCADE);
			this.shootSounds = new Array(3);
			this.shootSounds[ShootTypes.Regular] = game.add.audio('shoot');
			this.shootSounds[ShootTypes.Regular].allowMultiple = true;
			this.shootSounds[ShootTypes.Medium] = game.add.audio('shot_Medium');
			this.shootSounds[ShootTypes.Medium].allowMultiple = true;
			this.shootSounds[ShootTypes.Large] = game.add.audio('shot_Large');
			this.shootSounds[ShootTypes.Large].allowMultiple = true;

			this.projectileDefinitions = new Array(3);
			this.projectileDefinitions[ShootTypes.Regular] = new ProjectileDefinition(
				new AnimationArguments('default', Phaser.Animation.generateFrameNames('bullet', 1, 1, '', 4), 1, true),
				null,
				new AnimationArguments('death', Phaser.Animation.generateFrameNames('bullet', 2, 3, '', 4), 30, false)
			);
			this.projectileDefinitions[ShootTypes.Medium] = new ProjectileDefinition(
				new AnimationArguments('default', Phaser.Animation.generateFrameNames('medium', 5, 6, '', 4), 2, true),
				new AnimationArguments('creation', Phaser.Animation.generateFrameNames('medium', 1, 4, '', 4), 30, false),
				new AnimationArguments('death', Phaser.Animation.generateFrameNames('medium', 8, 12, '', 4), 30, false)
			);
			this.projectileDefinitions[ShootTypes.Large] = new ProjectileDefinition(
				new AnimationArguments('default', Phaser.Animation.generateFrameNames('large', 4, 4, '', 4), 1, true),
				new AnimationArguments('creation', Phaser.Animation.generateFrameNames('large', 1, 3, '', 4), 30, false),
				new AnimationArguments('death', Phaser.Animation.generateFrameNames('large', 6, 10, '', 4), 30, false)
			);

			this.chargeStartSound = game.add.audio('shotCharge_Start');
			this.chargeLoopSound = game.add.audio('shotCharge_Loop');
			this.chargeLoopSound.loop = true;
			//this.shootSound.addMarker('shoot', 0.75, 1.0);
            //game.physics.enable(this, Phaser.Physics.NINJA);

            this.body.collideWorldBounds = false;
            //this.body.gravity.x = 0;
            this.body.gravity.y = Player.regularGravity;
            //this.body.gravity.clampY(0, 5);
            this.body.allowGravity = true;
            //this.body.allowCollision.any = true;
            this.body.setSize(30, 30, 0, 0);
            this.body.bounce.setTo(0, 0);

            this.canJump = true;
            this.onGround = false;
            this.jumped = false;
            this.wallSliding = false;
			this.teleporting = true;
			this.shootReleased = true;
			this.shotCharge = 0;
			this.hasShot = false;

			game.add.existing(this);

			this.animatedSprite = new AnimatedSprite(game, -0.5, -0.5, 'megamanx', 0);
			game.add.existing(this.animatedSprite);
			this.addChild(this.animatedSprite);
			this.animatedSprite.currentAnimation = this.animatedSprite.animations.add('idle', Phaser.Animation.generateFrameNames('idle', 1, 1, '', 4), 1, true);
			this.animatedSprite.animations.add('idleBlink', Phaser.Animation.generateFrameNames('idle', 2, 3, '', 4), 1, true);
			this.animatedSprite.animations.add('run', Phaser.Animation.generateFrameNames('run', 1, 11, '', 4), 25, true);
			this.animatedSprite.animations.add('runShoot', Phaser.Animation.generateFrameNames('runshoot', 1, 10, '', 4), 25, true);
			this.animatedSprite.animations.add('idleShoot', Phaser.Animation.generateFrameNames('shoot', 1, 2, '', 4), 30, true);
			this.animatedSprite.animations.add('jumpStart', Phaser.Animation.generateFrameNames('jump', 1, 3, '', 4), 30, false);
			this.animatedSprite.animations.add('jumpInAir', Phaser.Animation.generateFrameNames('jump', 4, 4, '', 4), 15, false);
			this.animatedSprite.animations.add('jumpFinish', Phaser.Animation.generateFrameNames('jump', 5, 7, '', 4), 30, false);
			this.animatedSprite.animations.add('jumpStartShoot', Phaser.Animation.generateFrameNames('jumpshoot', 1, 3, '', 4), 30, false);
			this.animatedSprite.animations.add('jumpInAirShoot', Phaser.Animation.generateFrameNames('jumpshoot', 4, 4, '', 4), 15, false);
			this.animatedSprite.animations.add('jumpFinishShoot', Phaser.Animation.generateFrameNames('jumpshoot', 5, 7, '', 4), 30, false);
			//this.animations.add('fall', Phaser.Animation.generateFrameNames('misc', 2, 2, '', 4), 15, false);
			this.animatedSprite.animations.add('wallSlide', Phaser.Animation.generateFrameNames('wallslide', 1, 1, '', 4), 15, false);
			this.animatedSprite.animations.add('wallSlideShoot', Phaser.Animation.generateFrameNames('wallslideshoot', 1, 2, '', 4), 15, false);
			this.animatedSprite.animations.add('teleportStart', Phaser.Animation.generateFrameNames('teleport', 1, 1, '', 4), 15, false);
			this.animatedSprite.animations.add('teleportFinish', Phaser.Animation.generateFrameNames('teleport', 2, 8, '', 4), 30, false);

			this.healthBar = new HealthBar(game, 0, 50, null, null, 25, 10);
			game.add.existing(this.healthBar);

			this.jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
			this.jumpKey.onDown.add(this.jump, this);

			this.shootKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
			this.shootKey.onDown.add(this.tryShoot, this);
			this.shootKey.onUp.add(this.onShootReleased, this);
			this.shootKey.onHoldCallback = this.onChargingShot;
			this.shootKey.onHoldContext = this;

        }

        create()
        {
            console.log('creating player');
        }

        update()
        {
            //Don't allow input while teleporting
            if (this.teleporting === true)
                return;

            this.checkMovement();

            //Jump
   //         if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP) && this.canJump)
   //         {
                
			//}

			//if (this.game.input.keyboard.isDown(Phaser.Keyboard.D) && this.canShoot())
			//{
			//	this.shoot();
			//}

			if (this.animatedSprite.getCurrentAnimationName() === 'wallSlide')
            {
                this.body.gravity.y = Player.slidingGravity;
                //this.body.velocity.clampY(0, 25.0);
            }
            else
            {
                this.body.gravity.y = Player.regularGravity;
                //this.body.velocity.clampY(0, 75);
            }

            //this.frameVelocityX = this.body.velocity.x;
            //this.frameVelocityY = this.body.velocity.y;
		}

		jump()
		{
			if (!this.canJump)
				return;

			//Move the body up a hair so we can jump
			this.body.y -= 1;
			//Jump
			//this.body.gravity.clampY(-150, 0);
			this.body.velocity.y = -Player.jumpVelocty;

			//Jump away from the wall
			if (this.animatedSprite.getCurrentAnimationName() === 'wallSlide' || this.onGround === false) {
				console.log('jump while sliding');
				this.body.velocity.x = (Player.jumpVelocty * -(this.scale.x));
				this.wallSliding = false;
			}
			else
				console.log('jump while not sliding');


			this.canJump = false;
			this.jumped = true;
			this.onGround = false;
		}

		canShoot()
		{
			return this.shootReleased;
			//return this.nextShootTime <= this.game.time.totalElapsedSeconds();
		}

		tryShoot()
		{
			if (!this.canShoot())
				return;

			this.shoot(ShootTypes.Regular);
		}

		shoot(type: ShootTypes)
		{
			this.hasShot = true;
			this.shootReleased = false;
			//Play animation
			var currentAnimationName = this.animatedSprite.getCurrentAnimationName();
			var isShooting = this.isShootAnimation(currentAnimationName);
			if (!isShooting)
			{
				if (this.animationHasShootCounterpart(currentAnimationName))
				{
					var resetFrame = !(currentAnimationName.indexOf('jump') >= 0);
					var newAnimationName = this.animatedSprite.getCurrentAnimationName() + 'Shoot';
					this.animatedSprite.stopAnimation(null, resetFrame);
					this.animatedSprite.playAnimation(newAnimationName);
				}
				else
					return;
			}

			var direction = this.scale.x * (this.wallSliding ? -1 : 1);
			//Create the projectile
			var x = (this.body.x + ((this.body.width / 2) * direction)) ;
			var blasterY = (this.body.y + (this.body.height / 2) - 3);
			var projectileArguments = new ProjectileArguments(this.projectileDefinitions[type], (750 * direction), 0);
			projectileArguments.xScale = direction;
			var bullet = new Projectile(this.game, x, blasterY, projectileArguments, 'player_shoot');
			//We want the middle of the sprite to be in line with the blaster:
			var halfHeight = bullet.height / 2;
			bullet.y -= halfHeight;
			var convertedGame = (this.game as Game).addProjectile(bullet);
			//bullet.animations.add('default', Phaser.Animation.generateFrameNames('bullet', 1, 1, '', 4), 1, false);
			//bullet.animations.add('death', Phaser.Animation.generateFrameNames('bullet', 2, 3, '', 4), 30, true);
			//bullet.deathAnimation = 'death';
			//bullet.animations.play('default');
			bullet.initProjectile();
			this.playShootSound(type);
			
			//Update next shoot time
			this.chargeStartTime = this.game.time.totalElapsedSeconds() + Player.chargeDelayTime;
			this.currentShootStanceTimeout = this.game.time.totalElapsedSeconds() + Player.shootStanceTimeout;
		}

		onShootReleased()
		{
			this.shootReleased = true;
			this.hasShot = false;

			if (this.chargeStartSound.isPlaying)
				this.chargeStartSound.stop();
			if (this.chargeLoopSound.isPlaying)
				this.chargeLoopSound.stop();

			if (this.shotCharge > 0)
			{
				var type: ShootTypes = ShootTypes.Regular;
				if (this.shotCharge > 1 && this.shotCharge < 50)
					type = ShootTypes.Medium;
				else if (this.shotCharge >= 50)
					type = ShootTypes.Large;

				this.shoot(type);
				this.shootReleased = true;
				this.hasShot = false;
			}

			this.shotCharge = 0;
		}

		onChargingShot()
		{
			if (!this.hasShot)
			{
				this.shoot(ShootTypes.Regular);
				return;
			}

			if (this.chargeStartTime > this.game.time.totalElapsedSeconds() || this.shootReleased)
				return;

			if (this.shotCharge <= 0 && !this.chargeStartSound.isPlaying)
				this.chargeStartSound.play();
			this.shotCharge = (this.chargeStartSound.currentTime / this.chargeStartSound.duration) / 10;
			if (!this.chargeStartSound.isPlaying && !this.chargeLoopSound.isPlaying)
				this.chargeLoopSound.play();
		}

		playShootSound(type: ShootTypes)
		{
			this.shootSounds[type].play();
		}

        checkMovement()
        {
            //Move left/right
            if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
            {
                //If we were wallsliding and then pressed the opposite direction, then we are no long wallsliding
                if (this.scale.x === 1 && this.wallSliding === true)
                    this.canJump = this.wallSliding = false;

                if (this.body.velocity.x > -Player.maxSpeed)
                {
                    if(this.onGround === true)
                        this.body.velocity.x -= (this.body.velocity.x - Player.landMovementSpeed < -Player.maxSpeed) ? (-Player.maxSpeed - this.body.velocity.x) : Player.landMovementSpeed;
                    else
                        this.body.velocity.x -= (this.body.velocity.x - Player.airMovementSpeed < -Player.maxSpeed) ? (-Player.maxSpeed - this.body.velocity.x) : Player.airMovementSpeed;
                }
            }
            else if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
            {
                //If we were wallsliding and then pressed the opposite direction, then we are no long wallsliding
                if (this.scale.x === -1 && this.wallSliding === true)
                    this.canJump = this.wallSliding = false;

                if (this.body.velocity.x < Player.maxSpeed)
                {
                    if (this.onGround === true)
                        this.body.velocity.x += (this.body.velocity.x + Player.landMovementSpeed > Player.maxSpeed) ? (Player.maxSpeed - this.body.velocity.x) : Player.landMovementSpeed;
                    else
                        this.body.velocity.x += (this.body.velocity.x + Player.airMovementSpeed > Player.maxSpeed) ? (Player.maxSpeed - this.body.velocity.x) : Player.airMovementSpeed;
                }
            }
            else
            {
                this.wallSliding = false;
                this.body.velocity.x = 0;
            }
        }

        collisionCallback(obj1: Phaser.Sprite, obj2: Phaser.Sprite)
        {
            if (obj1 === this)
            {
                if (obj1.body.touching.down && this.teleporting === true)
                    this.teleporting = false;

                if (obj1.body.touching.down)
                    this.onGround = true;
                else
                    this.onGround = false;

                this.canJump = true;
                this.jumped = false;

                //If we're touching a wall and we're not on the ground and we're falling
                //Then we should be wallsliding
                if (
                        (this.body.touching.left || this.body.touching.right) &&
                        this.onGround === false &&
                        this.body.velocity.y > 0
                   )
                    this.wallSliding = true;
                else
                    this.wallSliding = false;
            }
        }

        teleportToGround()
        {
            this.teleporting = true;
			//this.currentAnimation = this.animations.play('teleportStart');
			this.animatedSprite.playAnimation('teleportStart');
            this.body.gravity.y = Player.teleportGravity;
            //this.body.gravity.clampY(0, 150);
            //start off screen
			this.body.y = 0 - this.animatedSprite.currentAnimation.currentFrame.height;
        }

        updateCurrentAnimation()
        {
			if (this.animatedSprite.currentAnimation === undefined)
                return;

			var currentAnimationName = this.animatedSprite.getCurrentAnimationName();
			var isShooting = this.isShootAnimation(currentAnimationName);
			currentAnimationName = this.getNonShootAnimation(currentAnimationName);
			if (currentAnimationName === 'teleportStart')
            {
                //console.log('current animation is teleportStart');
                if (this.teleporting === true)
                {
                    //console.log('we are teleporting. returning out of updateCurrentAnimation');
                    return;
                }
                else
                {
                    //console.log('we are no long teleporting. stopping teleportStart animation');
					//this.animations.stop(this.getCurrentAnimationName(), true);
					this.animatedSprite.stopAnimation(null, true);
					//this.currentAnimation = this.animations.play('teleportFinish');
					this.animatedSprite.playAnimation('teleportFinish');
                    this.body.gravity.y = Player.regularGravity;

                    return;
                }
			}
			else if (currentAnimationName === 'teleportFinish')
            {
				if (this.animatedSprite.currentAnimation.isFinished === false)
                {
                    //console.log('in teleportFinish animation. returning.');
                    return;
                }
                //else
                    //console.log('teleportFinish animation is done.  continuing on.');
            }

            //console.log('current animation is not null: ' + this.getCurrentAnimationName());
			//this.animatedSprite.nextAnimation = this.animatedSprite.currentAnimation;
			var nextAnimation = currentAnimationName;

            if (this.wallSliding === true)
            {
				nextAnimation = 'wallSlide';
            }
            //Display appropriate animation
            else if
            (
                (
                    this.body.touching.down === false
					&& currentAnimationName !== 'run'
                    /*&& this.body.deltaY() > 1.0*/
                )
                || this.jumped === true
            )
            {
                //This isn't techically true, but it'll do for now
                //this.animations.play('jump');
                //this.nextAnimation = 'jump';

                //If we've jumped and our jump animation is done playing and we're falling
                //Play the in-air animation
				if (currentAnimationName === 'jumpStart' &&
					this.animatedSprite.currentAnimation.isFinished &&
                    this.body.velocity.y >= 0)
                {
                    nextAnimation = 'jumpInAir';
                }
				else if (this.body.velocity.y < 0 && currentAnimationName !== 'jumpStart')
                {
                    //if we're going up and our animation isn't jump and we jumped
                    nextAnimation = 'jumpStart';
                }
                else if(this.jumped === false)
                {
                    //Regular falling animation goes here.
                    nextAnimation = 'jumpInAir';
                }
            }
            else if (this.body.velocity.x !== 0 && this.jumped === false)
            {
                //Wait until our jumpFinish animation is done to move.
				if (currentAnimationName !== 'jumpFinish' ||
					(currentAnimationName === 'jumpFinish' && this.animatedSprite.currentAnimation.isFinished))
                {
                    if (this.body.velocity.x > 0)
                    {
                        //this.animations.play('run');
                        nextAnimation = 'run';
                    }
                    else if (this.body.velocity.x < 0)
                    {
                        //this.animations.play('run');
                        nextAnimation = 'run';
                    }
                }
            }
            else
            {
                //We should be idling.
                nextAnimation = 'idle';
            }

            //If we JUST got done jumping/falling: play the jumpFinish animation
            if (this.body.touching.down && this.body.deltaY() > 1.0)
            {
                nextAnimation = 'jumpFinish';
            }

            //Face the player in the correct direction
            if (this.body.velocity.x > 0 && this.scale.x === -1)
            {
                this.scale.x = 1;
            }
            else if (this.body.velocity.x < 0 && this.scale.x === 1)
            {
                this.scale.x = -1;
			}

			if
			(
				isShooting &&
				(this.currentShootStanceTimeout <= this.game.time.totalElapsedSeconds()) &&
				(
					this.isShootAnimation(nextAnimation) ||
					nextAnimation === currentAnimationName
				)
			)
			{
				nextAnimation = this.getNonShootAnimation(nextAnimation);
				currentAnimationName = this.animatedSprite.getCurrentAnimationName();
			}

			if(nextAnimation !== currentAnimationName)
			{
				nextAnimation = this.getAppropriateAnimation(nextAnimation, isShooting);
				if (nextAnimation === '')
				{
					var stopHere = 1;
					var anotherStopHere = 'We should stop here';
					nextAnimation = 'WHYISTHISLIKETHIS?!';
				}
				//console.log('stopping animation: ' + this.getCurrentAnimationName());
				this.animatedSprite.stopAnimation(null, true);
                //this.animations.stop(this.getCurrentAnimationName(), true);
                //console.log('attempting to play new animation: ' + this.nextAnimation.name);
				//this.currentAnimation = this.animations.play(this.nextAnimation.name);
				this.animatedSprite.playAnimation(nextAnimation);
                //this.body.setSize(30, 30, 0, 0);
                //console.log('current animation after play attempt: ' + this.getCurrentAnimationName());
            }
		}

		getAppropriateAnimation(nextAnimation: string, isShooting: boolean)
		{
			if (this.isShootAnimation(nextAnimation))
			{
				if
				(
					!isShooting ||
					this.currentShootStanceTimeout <= this.game.time.totalElapsedSeconds()
				)
					return this.getNonShootAnimation(nextAnimation);
				else
					return nextAnimation;
			}
			else
			{
				if (isShooting && this.currentShootStanceTimeout > this.game.time.totalElapsedSeconds())
					return nextAnimation + 'Shoot';
				else
					return nextAnimation;
			}
				

			//if
			//(
			//	!(this.animationHasShootCounterpart(nextAnimation)) ||
			//	this.currentShootStanceTimeout <= this.game.time.totalElapsedSeconds()
			//)
			//	return nextAnimation;
			//return nextAnimation + 'Shoot';
		}

		animationHasShootCounterpart(animation: string)
		{
			return animation.indexOf('jump') >= 0 ||
				animation.indexOf('run') >= 0 ||
				animation.indexOf('wallSlide') >= 0 ||
				animation.indexOf('idle') >= 0;
		}

		isShootAnimation(animation: string)
		{
			return animation.indexOf('Shoot') >= 0;
		}

		getNonShootAnimation(animation: string)
		{
			return (this.isShootAnimation(animation)) ? animation.replace('Shoot', '') : animation;
		}
    }
}