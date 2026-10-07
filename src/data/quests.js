// Quest System Data
export const QUESTS = [
  {
    id: "Q01",
    name: "Tìm người thân",
    description: "Bạn vừa trở về làng trong đêm tối sau khi nghe tin người thân mất tích bí ẩn. Hãy vào ngôi nhà cũ của gia đình để tìm lại ký ức và manh mối.",
    objective: "Vào ngôi nhà cũ của gia đình và tìm Bức ảnh gia đình (CLUE 02).",
    targetLocation: "Nhà nhân vật chính",
    completed: false
  },
  {
    id: "Q02",
    name: "Nói chuyện với bà Lan",
    description: "Bà Lan là hàng xóm lâu năm sống ở đầu làng. Hãy đến hỏi thăm bà về những sự việc kỳ lạ gần đây.",
    objective: "Đến nhà Bà Lan và nói chuyện để tìm hiểu tung tích người thân.",
    targetLocation: "Nhà Bà Lan",
    completed: false
  },
  {
    id: "Q03",
    name: "Điều tra cái giếng",
    description: "Bà Lan đã cảnh báo bạn không được đến gần cái giếng làng. Nhưng những âm thanh kỳ lạ dưới giếng giục giã bạn phải tới đó điều tra.",
    objective: "Tiến đến Giếng Làng, thu thập Chiếc Vòng Cổ (CLUE 01) và Dấu Chân Lạ (CLUE 03).",
    targetLocation: "Giếng làng",
    completed: false
  },
  {
    id: "Q04",
    name: "Tìm manh mối tại nghĩa địa",
    description: "Ông Tư và dân làng hé lộ về những dấu tích quỷ dị xuất hiện tại khu mộ cổ phía sau đình làng.",
    objective: "Đi tới Nghĩa Địa và tìm kiếm Trang Nhật Ký Cũ (CLUE 05) trên bia mộ hoang.",
    targetLocation: "Nghĩa địa",
    completed: false
  },
  {
    id: "Q05",
    name: "Gặp Người Giữ Miếu ở cửa rừng",
    description: "Một bóng người bí ẩn đứng ở lối mòn dẫn vào rừng. Đó có thể là Người Giữ Miếu Cũ nắm giữ bí mật cổ xưa.",
    objective: "Nói chuyện với Người Giữ Miếu để nhận Bùa Trấn Yểm (CLUE 08) và mở lối vào rừng.",
    targetLocation: "Con đường dẫn vào rừng",
    completed: false
  },
  {
    id: "Q06",
    name: "Tìm đường đến Miếu Cũ",
    description: "Lần theo các dấu máu và mảnh vải xé rách xuyên qua rặng rừng tre u tối để đến khu Miếu Cũ linh thiêng.",
    objective: "Nhặt Mảnh Vải (CLUE 07) và đi sâu vào Miếu Cũ.",
    targetLocation: "Miếu Cũ",
    completed: false
  },
  {
    id: "Q07",
    name: "Phát hiện người thân",
    description: "Bạn đã đến được Miếu Cũ! Người thân đang bị trói giam giữ giữa bàn tế lễ, nhưng một nguồn tà khí khủng khiếp đang ập đến.",
    objective: "Tiếp cận bàn thờ tế lễ để cứu người thân.",
    targetLocation: "Bàn thờ Miếu Cũ",
    completed: false
  },
  {
    id: "Q08",
    name: "Đối đầu & Tiêu diệt Quỷ Cẩu",
    description: "Quỷ Cẩu đã hiện nguyên hình! Hãy né tránh đòn vồ, kích hoạt 3 Bệ Thờ Trấn Yểm và dùng Ngọn Lửa Thiêng để tiêu diệt nó!",
    objective: "Kích hoạt 3 Bệ Thờ xung quanh miếu để phá kết giới tà khí, sau đó thiêu hủy Quỷ Cẩu!",
    targetLocation: "Khu vực Boss Miếu Cũ",
    completed: false
  },
  {
    id: "Q09",
    name: "Cứu người thân & Rời khỏi làng",
    description: "Quỷ Cẩu đã bị đánh bại tan biến thành tro bụi. Hãy cởi trói cho người thân và dẫn cô ấy an toàn rời khỏi làng trước bình minh.",
    objective: "Cởi trói giải cứu người thân và đưa cô ấy trở về Cổng Làng.",
    targetLocation: "Cổng làng",
    completed: false
  }
];
