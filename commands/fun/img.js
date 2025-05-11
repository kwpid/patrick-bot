const { EmbedBuilder } = require('discord.js');

// To add images:
// 1. Upload the image to Discord
// 2. Right-click the image
// 3. Click "Copy Media Link" or "Copy Image Address"
// 4. The URL should look like: https://cdn.discordapp.com/attachments/...
const patrickImages = [
"https://media.discordapp.net/attachments/799428131714367498/1371205284898275409/Z.png?ex=682249ef&is=6820f86f&hm=94144c803c1275eb662aa35ccfa886d74386fa9561af0fbf288ddfa8dba354da&=&format=webp&quality=lossless&width=162&height=253",
"https://media.discordapp.net/attachments/799428131714367498/1371205306599608391/2Q.png?ex=682249f4&is=6820f874&hm=fc3c8706f4b694d6acfaf7701d133162b3836e1f27903a9d96e7a326f9b6ff9a&=&format=webp&quality=lossless&width=202&height=202",
"https://media.discordapp.net/attachments/799428131714367498/1371205511357403166/9k.png?ex=68224a25&is=6820f8a5&hm=593faed672244f6ce5376ff8432e906964205903517a5eb29d3d8dc442aa9f8c&=&format=webp&quality=lossless&width=165&height=248",
"https://media.discordapp.net/attachments/799428131714367498/1371226789216649276/2Q.png?ex=68225df6&is=68210c76&hm=62a7f669da9d69d5d290970a7cb9eaed12503d2b11422739483dd8cd6b7c96de&=&format=webp&quality=lossless",
"https://media.discordapp.net/attachments/799428131714367498/1371226857147727992/Z.png?ex=68225e06&is=68210c86&hm=dc5eac22033756462dcdd7f0b3e07ab5153f78db2c330772bd477e7440bc5107&=&format=webp&quality=lossless",
"https://media.discordapp.net/attachments/799428131714367498/1371226923975446652/images.png?ex=68225e16&is=68210c96&hm=09c259dc9584b2093f6821ec8ea7d5577eac99b80b1d0c488da0b0b0e902c1bf&=&format=webp&quality=lossless",
"https://media.discordapp.net/attachments/799428131714367498/1371226976022429806/images.png?ex=68225e23&is=68210ca3&hm=e59b26907982594dec163166378a375a74e0b0a7ef386651548e6ca3543699fb&=&format=webp&quality=lossless",
"https://media.discordapp.net/attachments/799428131714367498/1371227044880318464/GpjXG9.png?ex=68225e33&is=68210cb3&hm=89c21099bb67ee1a89dfa64d63265ff3d20fd2da0928a0e0e36a1f80ea3060fe&=&format=webp&quality=lossless",
"https://media.discordapp.net/attachments/987477534893551716/1371230763718148238/image0.jpg?ex=682261aa&is=6821102a&hm=a10d6baf9681cbab31429dce49783c0ba015cdbb52e5ace67738de4b5a5e9b00&=&format=webp&width=650&height=652",
"https://cdn.discordapp.com/attachments/987477534893551716/1371230963669139466/image0.jpg?ex=682261d9&is=68211059&hm=88af40f121409f302ef398b8469a351cd3b127ca69252b0335ea9e135afa1d02&",
"https://media.discordapp.net/attachments/987477534893551716/1371231033462095922/image0.jpg?ex=682261ea&is=6821106a&hm=8aef2b68dcbf24f6d6dc983858eaa01dd1dd540da55c120fcffbbe4779a983ed&=&format=webp&width=738&height=549",
"https://media.discordapp.net/attachments/987477534893551716/1371231120779116694/image0.jpg?ex=682261ff&is=6821107f&hm=529816b7b54fccecb88a7ce30c3fd4bd38ab0aade1e6e587efe92493daf89260&=&format=webp",
"https://media.discordapp.net/attachments/987477534893551716/1371231120779116694/image0.jpg?ex=682261ff&is=6821107f&hm=529816b7b54fccecb88a7ce30c3fd4bd38ab0aade1e6e587efe92493daf89260&=&format=webp",
"https://media.discordapp.net/attachments/987477534893551716/1371231183794343956/image0.jpg?ex=6822620e&is=6821108e&hm=918bdd99d8467874d2429482aa73f2843cd653726a4bfad085d82df9bcbc2b42&=&format=webp&width=620&height=653",
"https://media.discordapp.net/attachments/987477534893551716/1371231286533951539/image0.jpg?ex=68226226&is=682110a6&hm=bce28a1ed50779956ce6830d7ff8db091653944c98e4e332b41626ee315088df&=&format=webp&width=816&height=549",
"https://media.discordapp.net/attachments/987477534893551716/1371231360936706131/image0.jpg?ex=68226238&is=682110b8&hm=da35e2f386d483ac441bc8d291c55e7ce0a282cd9312829c14980ab21a34b5cb&=&format=webp",
"https://media.discordapp.net/attachments/987477534893551716/1371232394044113077/image0.jpg?ex=6822632f&is=682111af&hm=76abe630f9a5fe5f0d56f40e1437552455987a1daa2a0b60f5c5ea279f130c8f&=&format=webp&width=740&height=549",
"https://media.discordapp.net/attachments/987477534893551716/1371233104890564668/image0.jpg?ex=682263d8&is=68211258&hm=9d69d7dd492f4968512e8b95f2d212f89291ca4cbe165f13724cc8afce16474a&=&format=webp&width=773&height=549",
"https://media.discordapp.net/attachments/987477534893551716/1371233176634261626/image0.jpg?ex=682263e9&is=68211269&hm=0a19d393b454a0a4d333eb07772305c65b7c71b514a1604428a1475bcebb16fa&=&format=webp&width=654&height=653",
"https://media.discordapp.net/attachments/987477534893551716/1371233238194065560/image0.jpg?ex=682263f8&is=68211278&hm=84200090e90870c69c2ba1eb78f6b85c5e461caeec3e95d814b008d1771d46cc&=&format=webp&width=637&height=652",
"https://media.discordapp.net/attachments/987477534893551716/1371233375779819570/image0.jpg?ex=68226419&is=68211299&hm=a7c77bb9fef71a5c6cc09eca366df8719a965b66dc562b17894d8e0b0e5a8a5d&=&format=webp&width=664&height=653",
"https://media.discordapp.net/attachments/987477534893551716/1371233614146174986/image0.jpg?ex=68226451&is=682112d1&hm=156d15993ac9481a282298a3fd312fa802253767af95ccac09297f3bde5dae32&=&format=webp&width=433&height=653",
"https://media.discordapp.net/attachments/987477534893551716/1371233922889027665/image0.jpg?ex=6822649b&is=6821131b&hm=628aa0bf4483c1ae396df0b72d4c8a4999eff9ca5206082cba0386648969dcbe&=&format=webp&width=736&height=549",
"https://media.discordapp.net/attachments/987477534893551716/1371234077889269830/image0.jpg?ex=682264c0&is=68211340&hm=4b8b980a470bfa68429f3802ee3e41e523375770b71e542a066a9a667ee616b6&=&format=webp&width=657&height=653",

];

// Keep track of the last image shown
let lastImage = null;

module.exports = {
    name: 'img',
    description: 'shows a random patrick image',
    execute(message, client) {
        if (patrickImages.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#292929')
                .setTitle("no images found")
                .setDescription("*i don't have any pictures of me yet*")
                .setFooter({ text: 'patrick' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        // Get a random image that's different from the last one
        let randomImage;
        do {
            randomImage = patrickImages[Math.floor(Math.random() * patrickImages.length)];
        } while (randomImage === lastImage && patrickImages.length > 1);
        
        // Update last image
        lastImage = randomImage;

        const embed = new EmbedBuilder()
            .setColor('#292929')
            .setTitle("look at me!")
            .setImage(randomImage)
            .setFooter({ text: 'patrick' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
}; 