function decodeInfohash(infohash: string) {
  // 将百分号编码的字符串转换为十六进制字符串
  let hexString = "";
  for (let i = 0; i < infohash.length; i++) {
    if (infohash[i] === "%") {
      // 获取百分号后面的两个字符
      const hex = infohash.substring(i + 1, i + 3);
      hexString += hex;
      // 跳过这两个字符
      i += 2;
    } else {
      // 将非百分号编码字符转换为十六进制
      const hex = infohash.charCodeAt(i).toString(16);
      hexString += hex.padStart(2, "0"); // 确保每个字符用两个十六进制数字表示
    }
  }
  return hexString;
}

// 示例使用：假设 infohash 是 URL 编码的字符串
const encodedInfohash = "%96ut%5d%ad%3et%e5%cc%bcHj%26%11%bc%de%ea%ef%3b%25";
const hexString = decodeInfohash(encodedInfohash);
console.log(hexString); // 输出: 9675745dad3e74e5ccbc486a2611bcdeeaef3b25
