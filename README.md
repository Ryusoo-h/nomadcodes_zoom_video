# Noom
Zoom Clone using NodeJS, WebRTC and Websokets.

## 현재 결과물
1. 같은 네트워크 안에서 1:1로 영상통화 가능    
    - 첫화면에서 방이름을 적고 [Enter Room]을 클릭하면 방에 들어갈 수 있다.   
    ![방입장](https://user-images.githubusercontent.com/67295471/194081537-a0bc90c5-c6cd-40b2-839f-8467e9aff903.gif)
    <br>
    - 처음 방에 들어간다면 기기 사용 허용을 해주어야한다   
    ![처음 방에 들어가면](https://user-images.githubusercontent.com/67295471/194118531-f02b7328-8995-4c0a-9f40-71642e498a97.jpg)  
    <br><br>

2. 비디오, 오디오 기기 변경, 뮤트, 화면숨기기 가능
    - 카메라 on/off
    ![카메라 온오프-min](https://user-images.githubusercontent.com/67295471/194068846-17bc3222-1c34-4936-973d-f5ae5a930dbc.gif)  
    <br><br>

4. 영상통화와 채팅 가능
    ![채팅-min](https://user-images.githubusercontent.com/67295471/194078928-47ddf9a7-62b2-4e6c-bb68-b66bd7c0873d.gif)
<br><br>

---
## nomadcoders : 줌 클론코딩 강의  
[🖇줌 클론코딩](https://nomadcoders.co/noom/lobby)  
<br> 
[🖇강의 듣기 전 노션에 http, WebSocket, WebRTC 개념 정리한것](https://ryu-soohyeon.notion.site/http-WebSocket-WebRTC-08b141589e474b5cb1f4f94c8b4eb59b)

### 강의 내용
1. Node.js로 서버 설정, Express, pug, MVP CSS 사용

2. wegSocket을 사용해서 채팅방을 만들기

3. socket.IO로 채팅방 만들기
    - 채팅방을 만들거나 이미 만들어진 방에 들어갈 수 있다
    - 익명/닉네임으로 채팅이 가능하다
    - 방의 존재, 상태를 알려준다

4. Admin UI로 모든 소켓, room, 클라이언트를 확인하기

5. webRTC로 영상통화 만들기
    - 유저, 상대의 비디오, 오디오 출력
    - 비디오, 오디오 기기를 변경할 수 있다
    - 화면 숨기기 버튼, 뮤트 버튼을 사용할 수 있다
    - 영상통화 방 만들거나 들어갈 수 있다

6. Data Chennel로 메세지 주고받기

<br><br>

---
## 다음에 이어서 추가해볼 것

1. STUN 서버 만들기   
 -> 이것을 해결해야 다른 네트워크끼리도 연결 가능하다

2. [방 나가기] 버튼 추가   
    -> 클릭시 다시 방을 만드는/들어가는 화면으로 돌아가기
    - 끊긴유저의 화면 꺼주기 (지금은 마지막 화면인 상태로 멈춘다)
    - 끊겼다는 알림 띄우기 + [방 나가기] 버튼 보여주기

3. 휴대폰에서 전면, 후면 카메라 선택 가능하도록 만들기   
(지금은 안됨. '.' 기기 이름을 찾아서 변경하도록 코드를 적었는데, 폰에서는 기기이름이 출력안되서 안됨.. 휴대폰에서는 user(전면)/environment(후면)를 선택하는 방법을 쓴다더라!)