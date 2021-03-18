"use strict";

try {
	var canvas = document.querySelector("canvas");
	var c = canvas.getContext("2d");
	var { cos, sin, sqrt } = Math;

	var w = canvas.width = innerWidth,
		h = canvas.height = innerHeight,
		center = [w / 2, h / 2];
	
	var cameraX = 0;
    var cameraY = 0;
    var cameraZ = 0;
               
    var cameraRotX = 0;
    var cameraRotY = 0;
    var cameraRotZ = 0;
	
	var windowXratio = innerWidth/1920;
	var windowYratio = innerHeight/1080;
	
	var cull = true;
    
                
                //these values only corespond to real space and not camera relative space. they are used as an offset for objects within camera relative space

	// |x1 - x2| + |y1 - y2| + |z1 - z2| would be more stable
	var dist = (x, y, z, x1, y1, z1) => sqrt((x1 - x) ** 2 + (y1 - y) ** 2 + (z1 - z) ** 2);
	var axisX = (x, y, z, angleX, angleY, angleZ) => (x*(cos(angleX)*cos(angleY))) + (y*((cos(angleX)*sin(angleY)*sin(angleZ))-(sin(angleX)*cos(angleZ)))) + (z*((cos(angleX)*sin(angleY)*cos(angleZ))+(sin(angleX)*sin(angleZ))));
	var axisY = (x, y, z, angleX, angleY, angleZ) => (x*(sin(angleX)*cos(angleY))) + (y*((sin(angleX)*sin(angleY)*sin(angleZ))+(cos(angleX)*cos(angleZ)))) + (z*((sin(angleX)*sin(angleY)*cos(angleZ))-(cos(angleX)*sin(angleZ))));
	var axisZ = (x, y, z, angleX, angleY, angleZ) => (x*(sin(angleY)*-1)) + (y*(cos(angleY)*sin(angleZ))) + (z*(cos(angleY)*cos(angleZ)))
    
    //i hate literally everything about these things btw ^^
    
    function raycast(p,p1,n) {
        var para = (x,t,v) => x + t*v;
        
        var sx = p[0] - p1[0];
        var sy = p[1] - p1[1];
        var sz = p[2] - p1[2];
        
        var normalize = dist(0,0,0,sx,sy,sz);
        
        sx /= normalize;
        sy /= normalize;
        sz /= normalize;
        
        //t = -n-p/s
        //t = (-nx - px) / sx + (-ny - py) / sy + (-nz - pz) / sz
        
        var t = (-n[0] - p[0]) / sx + (-n[1] - p[1]) / sy + (-n[2] - p[2]) / sz;
        
        return [para(p[0],t,sx),para(p[1],t,sy),para(p[2],t,sz)];
    }

	function Node(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
        this.renderPoint = true;

		this.screenX = 0;
		this.screenY = 0;
        
        this.enlargePoint = false;
        this.selected = false;
		
		this.normal = [0,0,0];
		
		this.ax = 0;
		this.ay = 0;
		this.az = 0;
		
		this.cull = false;
		this.cullset = false;
	}
	function Face(nodes) {
		this.nodes = nodes;
		this.normal = [0,0,0];
		this.cull = false;
		this.origin = [0,0,0];
	}

	function Mesh(nodes, faces, name, x, y, z) {
		this.nodes = nodes;
		this.name = name;
		this.x = x;
		this.y = y * -1;
		this.z = z;
		this.rx = 0;
		this.ry = 0;
		this.rz = 0;
		
		this.faces = faces;
        
        this.screenY = 0;
        this.screenX = 0;
        
        this.enlargePoint = false;
        this.selected = false;

		this.setScreenCartesian = function() {
			for (var i = 0; i < this.nodes.length; i++) {

				var perspective = +document.querySelector("#persp").value/2;
                this.perspective = perspective;
				var rayVector = [];
				
				var fullRotX = this.rx + cameraRotX;
				var fullRotY = this.ry + cameraRotY;
				var fullRotZ = this.rz + cameraRotZ;
                
                this.fx = this.x + cameraX;
                this.fy = this.y + cameraY;
                this.fz = this.z + cameraZ;

				rayVector[0] = ((axisX(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ))) + axisX(this.nodes[i].x,this.nodes[i].y,this.nodes[i].z,fullRotX,fullRotY,fullRotZ);
				rayVector[1] = ((axisY(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ))) + axisY(this.nodes[i].x,this.nodes[i].y,this.nodes[i].z,fullRotX,fullRotY,fullRotZ);
				rayVector[2] = ((axisZ(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ))) + axisZ(this.nodes[i].x,this.nodes[i].y,this.nodes[i].z,fullRotX,fullRotY,fullRotZ);
				
				this.nodes[i].ax = rayVector[0];
				this.nodes[i].ay = rayVector[1];
				this.nodes[i].az = rayVector[2];
                
                
                /*if (rayVector[2] < -perspective) { 
                    this.nodes[i].renderPoint = false;
                } else {
                    this.nodes[i].renderPoint = true;  
                }*/

				var cameraNormal = [];
				cameraNormal[0] = 0;
				cameraNormal[1] = 0;
				cameraNormal[2] = perspective*100;

                this.nodes[i].screenX = raycast([rayVector[0], rayVector[1], rayVector[2]] , [0, 0, 0] , [cameraNormal[0], cameraNormal[1], cameraNormal[2]])[0]+center[0];
                if (this.nodes[i].screenX == NaN) {
                    this.nodes[i].screenX = 0;   
                }
                this.nodes[i].screenY = raycast([rayVector[0], rayVector[1], rayVector[2]] , [0, 0, 0] , [cameraNormal[0], cameraNormal[1], cameraNormal[2]])[1]+center[1];
                if (this.nodes[i].screenY == NaN) {
                    this.nodes[i].screenY = 0;   
                }
			}
            
            rayVector[0] = axisX(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ);
	        rayVector[1] = axisY(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ);
			rayVector[2] = axisZ(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ);
            
            var cameraNormal = [];
		    cameraNormal[0] = 0;
			cameraNormal[1] = 0;
			cameraNormal[2] = perspective*100;
   
            this.screenX = raycast([rayVector[0], rayVector[1], rayVector[2]] , [0, 0, 0] , [cameraNormal[0], cameraNormal[1], cameraNormal[2]])[0]+center[0];
		    this.screenY = raycast([rayVector[0], rayVector[1], rayVector[2]] , [0, 0, 0] , [cameraNormal[0], cameraNormal[1], cameraNormal[2]])[1]+center[1];
            
		}
		
		this.setNormals = function() {
			
			//vertex normals
			for (var k = 0; k < this.nodes.length; k++) { //traverse through node array to get index
				var referancesTo = 0;
				var averageX = 0;
				var averageY = 0;
				var averageZ = 0;
				for (var i = 0; i < this.faces.length; i++) {//access face hash array
					for (var h = 0; h < this.faces[i].nodes.length; h++) {//traverse that array
						if (k == this.faces[i].nodes[h]) { //if it identify's the node's index is within the current face array then add whats infront of it and whats behind it
                            var faceNodes = this.faces[i].nodes;
                            var nodeBack = this.nodes[this.faces[i].nodes[h-1]];
                            var nodeFront = this.nodes[this.faces[i].nodes[h+1]];
							if (h == this.faces[i].nodes.length-1) {		
                                nodeFront = this.nodes[faceNodes[0]];
							} else if (h == 0) {
								nodeBack = this.nodes[faceNodes[faceNodes.length-1]];
                            }
						    averageX += nodeBack.ax;
					       	averageY += nodeBack.ay;
							averageZ += nodeBack.az;
								
							averageX += nodeFront.ax;
							averageY += nodeFront.ay;
							averageZ += nodeFront.az;
                                
                            referancesTo += 2;
						}
					}
				}
                
                
				averageX /= referancesTo;
				averageY /= referancesTo;
				averageZ /= referancesTo;
				
				//get vertex normal
				
				var magnitude = dist(averageX,averageY,averageZ,this.nodes[k].x,this.nodes[k].y,this.nodes[k].z);
				this.nodes[k].normal[0] = Math.floor(((this.nodes[k].ax - averageX)/magnitude)*100000)/100000;
				this.nodes[k].normal[1] = Math.floor(((this.nodes[k].ay - averageY)/magnitude)*100000)/100000;
				this.nodes[k].normal[2] = Math.floor(((this.nodes[k].az - averageZ)/magnitude)*100000)/100000;
                
                //alert(this.nodes[k].normal[0] + ", " + this.nodes[k].normal[1] + ", " + this.nodes[k].normal[2])
			}
			
			//set face normals
			for (var i = 0; i < this.faces.length; i++) {
				var normal = [0,0,0];
                //p = polygon
                var nodes = this.faces[i].nodes;
                
                var averageX = 0,
                    averageY = 0,
                    averageZ = 0;

                var testX = 0,
                    testY = 0,
                    testZ = 0;
                for (var k = 0; k < nodes.length; k++) {
                    var j = (k + 1) % (nodes.length);
                    normal[0] += (this.nodes[nodes[k]].ay - this.nodes[nodes[j]].ay) * (this.nodes[nodes[k]].az + this.nodes[nodes[j]].az);
                    normal[1] += (this.nodes[nodes[k]].az - this.nodes[nodes[j]].az) * (this.nodes[nodes[k]].ax + this.nodes[nodes[j]].ax);
                    normal[2] += (this.nodes[nodes[k]].ax - this.nodes[nodes[j]].ax) * (this.nodes[nodes[k]].ay + this.nodes[nodes[j]].ay);

                    averageX += this.nodes[nodes[k]].ax;
                    averageY += this.nodes[nodes[k]].ay;
                    averageZ += this.nodes[nodes[k]].az;

                    testX += this.nodes[nodes[k]].normal[0];
                    testY += this.nodes[nodes[k]].normal[1];
                    testZ += this.nodes[nodes[k]].normal[2];
                }
                this.faces[i].normal[0] = normal[0];
                this.faces[i].normal[1] = normal[1];
                this.faces[i].normal[2] = normal[2];
                
                testX /= nodes.length;
                testY /= nodes.length;
                testZ /= nodes.length;
                
                if ((normal[0] < 0 && testX > 0) || (normal[0] > 0 && testX < 0)) {
                    this.faces[i].normal[0] *= -1
                }
                if ((normal[1] < 0 && testY > 0) || (normal[1] > 0 && testY < 0)) {
                    this.faces[i].normal[1] *= -1 
                }
                if ((normal[2] < 0 && testZ > 0) || (normal[2] > 0 && testZ < 0)) {
                    this.faces[i].normal[2] *= -1
                }
                
                this.faces[i].origin[0] = averageX/nodes.length;
                this.faces[i].origin[1] = averageY/nodes.length;
                this.faces[i].origin[2] = averageZ/nodes.length;
			}
		}
		
		this.cullFaces = function() {
			for (var i = 0; i < this.nodes.length; i++) {	
				this.nodes[i].cullset = false;
			}	
			for (var i = 0; i < this.faces.length; i++) {
                var face = this.faces[i];
                var magnitude = dist(0,0,this.perspective*100,face.origin[0],face.origin[1],face.origin[2]);
				var dot = face.origin[0] * face.normal[0] + face.origin[1] * face.normal[1] + (face.origin[2]) * face.normal[2];
                this.faces[i].dot = dot;
				if (dot < 0) {
					this.faces[i].cull = false;
					for (var k = 0; k < this.faces[i].nodes.length; k++) {	
						this.nodes[this.faces[i].nodes[k]].cull = false;
						this.nodes[this.faces[i].nodes[k]].cullset = true;
					}
				} else {
					this.faces[i].cull = true;
					for (var k = 0; k < this.faces[i].nodes.length; k++) {	
						if (this.nodes[this.faces[i].nodes[k]].cullset == false) {
							this.nodes[this.faces[i].nodes[k]].cull = true;
						}
					}
				}
			}
		}

		this.render = function() {
			this.setScreenCartesian();
			this.setNormals();
            if (cull == true) {
                this.cullFaces();
            }
			for (var i = 0; i < this.faces.length; i++) {
				if (this.faces[i].cull == false) {
					c.strokeStyle = "white";
					c.moveTo(this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].screenX,this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].screenY);
					c.lineTo(this.nodes[this.faces[i].nodes[0]].screenX,this.nodes[this.faces[i].nodes[0]].screenY);
					c.stroke();
                    var ax = 0;
                    var ay = 0;
					for (var h = 0; h < this.faces[i].nodes.length-1; h++) {
						c.moveTo(this.nodes[this.faces[i].nodes[h]].screenX,this.nodes[this.faces[i].nodes[h]].screenY);
						c.lineTo(this.nodes[this.faces[i].nodes[h+1]].screenX,this.nodes[this.faces[i].nodes[h+1]].screenY);
						c.stroke();
					}
                    for (var h = 0; h < this.faces[i].nodes.length; h++) {
                        ax += this.nodes[this.faces[i].nodes[h]].screenX;
                        ay += this.nodes[this.faces[i].nodes[h]].screenY;   
                    }
                    ax /= this.faces[i].nodes.length;
                    ay /= this.faces[i].nodes.length;
				}
            }
  
            
			for (var i = 0; i < this.nodes.length; i++) {
				if (this.nodes[i].cull == false) {
					if (this.nodes[i].enlargePoint == false && this.nodes[i].selected == false) {
						c.beginPath();
						//c.arc(this.nodes[i].screenX, this.nodes[i].screenY, 5, 0, Math.PI*2);
						c.fillStyle = "white";
						c.fill();
					} else {
						c.beginPath();
						//c.arc(this.nodes[i].screenX, this.nodes[i].screenY, 10, 0, Math.PI*2);
						c.fillStyle = "white";
						c.fill();   
					}
					c.fillText(i,this.nodes[i].screenX+10,this.nodes[i].screenY+10);
				}
			}
            if (this.enlargePoint == false && this.selected == false) {
                c.fillStyle = "white";
                c.fillRect(this.screenX-2.5,this.screenY-2.5,5,5);
            } else {
                c.fillStyle = "white";
                c.fillRect(this.screenX-5,this.screenY-5,10,10); 
            }
            c.fillStyle = "white";
            c.fillText(this.x + ", " + this.y + ", " + this.z,this.screenX + 5, this.screenY + 5);
		}
	}

	var globalMeshArr = [];

	var createMesh = function(gx, gy, gz, size, type, name) {
		var nodeMount = [];
		var faceHashes = [];

		switch(type) {
			case "point":
				nodeMount.push(new Node(gx, gy, gz));
				break;

			case undefined:
				globalMeshArr.push(new Mesh(nodeMount, faceHashes, "unnamed", gx, gy, gz));
				break;

			case "cube": {
				nodeMount.push(new Node(size, size, -size)); //0 
				nodeMount.push(new Node(-size, size, -size)); //1
				nodeMount.push(new Node(-size, size, size)); //2
				nodeMount.push(new Node(size, size, size)); //3
				
				nodeMount.push(new Node(size, -size, -size)); //4
				nodeMount.push(new Node(-size, -size, -size)); //5
				nodeMount.push(new Node(-size, -size, size)); //6
				nodeMount.push(new Node(size, -size, size)); //7
				
				faceHashes.push(new Face([0,1,2,3]));
				faceHashes.push(new Face([4,5,6,7]));
				faceHashes.push(new Face([0,3,7,4]));
				faceHashes.push(new Face([0,1,5,4]));
				faceHashes.push(new Face([1,2,6,5]));
				faceHashes.push(new Face([2,3,7,6]));

				break;
			}

			case "line": {
				nodeMount.push(new Node(gx, gy, 0));
				nodeMount.push(new Node(gx, gy, 10));
				nodeMount.push(new Node(gx, gy, 20));
				nodeMount.push(new Node(gx, gy, 30));
				nodeMount.push(new Node(gx, gy, 40));

				break;
			}
		}
		
		globalMeshArr.push(new Mesh(nodeMount, faceHashes, name, gx, gy, gz));
	}

	createMesh(1, 1, 100, 10, "cube", "cube1");
    var boxSelect = false;
    var dragging = false;
    var startX;
    var startY;
    var boxX;
    var boxY;
    window.addEventListener("mousedown", function(event) {
        for (var i = 0; i < globalMeshArr.length; i++) {
            if (dist(event.x,event.y,0,globalMeshArr[i].screenX,globalMeshArr[i].screenY,0) < 10) {
                if (globalMeshArr[i].selected == false) {
                    globalMeshArr[i].selected = true;  
                } else {
                    globalMeshArr[i].selected = false;   
                }
            } else {
                if (boxSelect == false) {
                    globalMeshArr[i].selected = false;   
                }   
            }
            for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                if (dist(event.x,event.y,0,globalMeshArr[i].nodes[h].screenX,globalMeshArr[i].nodes[h].screenY,0) < 10 && globalMeshArr[i].nodes[h].cull == false) {
                    if (globalMeshArr[i].nodes[h].selected == false) {
                        globalMeshArr[i].nodes[h].selected = true;  
                    } else {
                        globalMeshArr[i].nodes[h].selected = false;   
                    }
                } else {
                    if (boxSelect == false) {
                        globalMeshArr[i].nodes[h].selected = false;   
                    }
                }
            }
        }
        if (boxSelect == true) {
            startX = event.x;
            startY = event.y;
            dragging = true;
        }
    });
    
    
    window.addEventListener("mousemove", function(event) {
        for (var i = 0; i < globalMeshArr.length; i++) {
            if (dist(event.x,event.y,0,globalMeshArr[i].screenX,globalMeshArr[i].screenY,0) < 10) {
                globalMeshArr[i].enlargePoint = true;   
            } else {
                globalMeshArr[i].enlargePoint = false;
            }
            for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                if (dist(event.x,event.y,0,globalMeshArr[i].nodes[h].screenX,globalMeshArr[i].nodes[h].screenY,0) < 10  && globalMeshArr[i].nodes[h].cull == false) {
                    globalMeshArr[i].nodes[h].enlargePoint = true;
                } else {
                    globalMeshArr[i].nodes[h].enlargePoint = false;   
                }
                
                if (dragging == true) {
                    if (globalMeshArr[i].nodes[h].screenX > startX && globalMeshArr[i].nodes[h].screenX < event.x && globalMeshArr[i].nodes[h].screenY > startY && globalMeshArr[i].nodes[h].screenY < event.y  && globalMeshArr[i].nodes[h].cull == false) {
                        globalMeshArr[i].nodes[h].selected = true; 
                        globalMeshArr[i].nodes[h].enlargePoint = true;
                    } else {
                        globalMeshArr[i].nodes[h].selected = false;   
                        globalMeshArr[i].nodes[h].enlargePoint = false;
                    }
                    boxX = event.x;
                    boxY = event.y;
                    boxSelect = true;
                }
                //possible optimization here. not sure what though
            }
        }
    });
    window.addEventListener("mouseup", function(event) {
        
        if (boxSelect == true) {
            boxSelect = false;
            dragging = false;
            startX = undefined;
            startY = undefined;
            boxX = undefined;
            boxY = undefined;
        }
    });
    var axisSelect;
    var snap = .01;
    var control = false;
    var rotating = false;
    var translating = true;
    window.addEventListener("keydown", function(event) {
        switch (event.key) {
            case "x":
                axisSelect = "x"
                break;
            case "y":
                axisSelect = "y";
                break;
            case "z":
                axisSelect = "z";
                break;
                
            case "Control":
                snap = 2;
                control = true;
                break;
                
                
            case "Shift":
                boxSelect = true;
                break;
                
            case "r":
                rotating = true;
                translating = false;
                break;
            case "t":
                translating = true;
                rotating = false;
                break;
                
            case "a":
                if (control == true) {
                    createMesh(0, 0, 40 * 10, 40, "cube", "cube1");  
                    alert();
                }
                break;
                
            case "ArrowUp":
                if (boxSelect == false) {
                    for (var i = 0; i < globalMeshArr.length; i++) {
                        for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                            if (globalMeshArr[i].selected == true) {
                                if (translating == true) {
                                    switch (axisSelect) {
                                        case "x" :
                                            globalMeshArr[i].x += snap;
                                            break;
                                        case "y" :
                                            globalMeshArr[i].y -= snap;
                                            break;
                                        case "z" :
                                            globalMeshArr[i].z += snap;
                                            break;
                                    } 
                                }
                                if (rotating == true) {
                                    switch (axisSelect) {
                                        case "x" :
                                            globalMeshArr[i].rx += snap/10;
                                            break;
                                        case "y" :
                                            globalMeshArr[i].ry -= snap/10;
                                            break;
                                        case "z" :
                                            globalMeshArr[i].rz += snap/10;
                                            break;
                                    } 
                                }
                            }
                            if (globalMeshArr[i].nodes[h].selected == true) {
                                switch (axisSelect) {
                                    case "x" :
                                        globalMeshArr[i].nodes[h].x += snap;
                                        break;
                                    case "y" :
                                        globalMeshArr[i].nodes[h].y -= snap;
                                        break;
                                    case "z" :
                                        globalMeshArr[i].nodes[h].z += snap;
                                        break;
                                }
                            }
                        }
                    }
                } else {
                    if (control == false) {
                        cameraY += 1;   
                    } else {
                        cameraZ -= 1;
                    }
                }
                break;
                
            case "ArrowDown":
                if (boxSelect == false) {
                    for (var i = 0; i < globalMeshArr.length; i++) {
                        for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                            if (globalMeshArr[i].selected == true) {
                                if (translating == true) {
                                    switch (axisSelect) {
                                        case "x" :
                                            globalMeshArr[i].x -= snap;
                                            break;
                                        case "y" :
                                            globalMeshArr[i].y += snap;
                                            break;
                                        case "z" :
                                            globalMeshArr[i].z -= snap;
                                            break;
                                    }   
                                }
                                if (rotating == true) {
                                    switch (axisSelect) {
                                        case "x" :
                                            globalMeshArr[i].rx -= snap/10;
                                            break;
                                        case "y" :
                                            globalMeshArr[i].ry += snap/10;
                                            break;
                                        case "z" :
                                            globalMeshArr[i].rz -= snap/10;
                                            break;
                                    }    
                                }
                            }
                            if (globalMeshArr[i].nodes[h].selected == true) {
                                switch (axisSelect) {
                                    case "x" :
                                        globalMeshArr[i].nodes[h].x -= snap;
                                        break;
                                    case "y" :
                                        globalMeshArr[i].nodes[h].y += snap;
                                        break;
                                    case "z" :
                                        globalMeshArr[i].nodes[h].z -= snap;
                                        break;
                                }
                            }
                        }
                    }
                } else {
                    if (control == false) {
                        cameraY -= 1;   
                    } else {
                        cameraZ += 1; 
                    }
                }
                break;
                    
            case "ArrowLeft":
                if (boxSelect == true && control == true) {
                    cameraX += 1;
                }
                
                break;
            case "ArrowRight":
                if (boxSelect == true && control == true) {
                    cameraX -= 1;
                }
                
                break;
                
        }
    });

    
    window.addEventListener("keyup",function(event) {
        switch (event.key) {
            case "Control" :
                snap = .01;
                control = false;
                break;
            case "Shift" :
                boxSelect = false;
                break;
        }
    })
    
	function animate() {
		requestAnimationFrame(animate);
        c.fillStyle = "black";
		c.fillRect(0, 0, innerWidth, innerHeight);
        
        cameraRotX = +document.querySelector("#xrot").value/10;
        cameraRotY = +document.querySelector("#yrot").value/10;
        cameraRotZ = +document.querySelector("#zrot").value/10;
        
        
        
		for (var o = 0; o < globalMeshArr.length; o++) {
            c.strokeStyle = "white";
			c.fillStyle = "black";
            //globalMeshArr[o].rx += .01;
            //globalMeshArr[o].ry += .01;
            //globalMeshArr[o].rz += .01;
			globalMeshArr[o].render();			
		}
        
        if (boxSelect == true) {
            c.strokeRect(startX,startY,boxX-startX,boxY-startY);
        }
        
	}

	animate();
} catch (err) {
	console.log(err);
}
