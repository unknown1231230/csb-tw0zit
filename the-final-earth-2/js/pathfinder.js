// Generated by Haxe 4.1.2
(function ($global) { "use strict";
function $extend(from, fields) {
	var proto = Object.create(from);
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var Pathfinder = function(thread) {
	this.emptySeen = null;
	this.seen = null;
	this.finalPathsPos = 1;
	this.handledAirConnections = null;
	this.thread = thread;
	this.pathQueue = new polygonal_ds_PriorityQueue(10,true);
};
Pathfinder.prototype = {
	handleMessage: function(data) {
		switch(data[0]) {
		case 0:
			this.handleGetFullWorldInfo(data);
			break;
		case 1:
			this.findPaths(data);
			break;
		case 2:
			break;
		}
	}
	,findPaths: function(data) {
		var dataPos = 2;
		var numberOfPaths = data[1];
		var _g = 0;
		var _g1 = numberOfPaths;
		while(_g < _g1) {
			var i = _g++;
			this.findPath(data[dataPos++],data[dataPos++],data[dataPos++],data[dataPos++],numberOfPaths - i);
		}
		this.sendPathsMessage();
	}
	,findPath: function(data0,data1,goal,privateTeleporter,pathsLeft) {
		var _gthis = this;
		this.pathQueue.clear();
		if(this.seen == null || this.seen.length != this.amountOfBuildings) {
			this.seen = new Int8Array(this.amountOfBuildings);
			this.emptySeen = new Int8Array(this.amountOfBuildings);
		} else {
			this.seen.set(this.emptySeen);
		}
		if(this.handledAirConnections == null || this.handledAirConnections.length != this.airGroupLength) {
			var _g = [];
			var _g1 = 0;
			var _g2 = this.airGroupLength;
			while(_g1 < _g2) {
				var i = _g1++;
				_g.push(0);
			}
			this.handledAirConnections = _g;
		} else {
			var _g = 0;
			var _g1 = this.airGroupLength;
			while(_g < _g1) {
				var i = _g++;
				this.handledAirConnections[i] = 0;
			}
		}
		var startsOutsideOfBuilding = data0 != -1;
		if(!startsOutsideOfBuilding) {
			var building = this.buildingsByID.h[data1];
			if(building == null) {
				this.generateNewPathsArrayIfNeeded(1,pathsLeft);
				this.finalPaths[0] += 1;
				this.finalPaths[this.finalPathsPos++] = 1;
				this.finalPaths[this.finalPathsPos++] = -1;
				return;
			} else {
				building.inEdge = null;
				building.previousBuilding = null;
				var _this = building;
				_this.priority = 0;
				this.pathQueue.enqueue(_this);
				this.seen[building.continuousID] = 1;
			}
		} else {
			var _g = 0;
			var _g1 = this.bottomBuildingsOfWorlds[data0];
			while(_g < _g1.length) {
				var connection = _g1[_g];
				++_g;
				var building = connection.to;
				building.inEdge = null;
				building.previousBuilding = null;
				var _this = building;
				var val = building.x - data1;
				_this.priority = val < 0 ? -val : val;
				this.pathQueue.enqueue(_this);
				this.seen[building.continuousID] = 1;
			}
		}
		var handledTeleporterConnections = false;
		while(this.pathQueue.mSize != 0) {
			var currentBuilding = this.pathQueue.dequeue();
			if(currentBuilding.id == goal) {
				var pathLength = 0;
				var backtraceBuilding = currentBuilding;
				while(backtraceBuilding.previousBuilding != null) {
					backtraceBuilding = backtraceBuilding.previousBuilding;
					++pathLength;
				}
				if(startsOutsideOfBuilding) {
					++pathLength;
				}
				this.generateNewPathsArrayIfNeeded(pathLength * 2,pathsLeft);
				this.finalPaths[0] += 1;
				this.finalPaths[this.finalPathsPos++] = pathLength * 2;
				this.finalPathsPos += pathLength * 2;
				var backtraceBuilding1 = currentBuilding;
				while(backtraceBuilding1.previousBuilding != null) {
					this.finalPathsPos -= 2;
					this.finalPaths[this.finalPathsPos] = backtraceBuilding1.inEdge.type;
					this.finalPaths[this.finalPathsPos + 1] = backtraceBuilding1.id;
					backtraceBuilding1 = backtraceBuilding1.previousBuilding;
				}
				if(startsOutsideOfBuilding) {
					this.finalPathsPos -= 2;
					this.finalPaths[this.finalPathsPos] = 5;
					this.finalPaths[this.finalPathsPos + 1] = backtraceBuilding1.id;
				}
				this.finalPathsPos += pathLength * 2;
				return;
			}
			this.seen[currentBuilding.continuousID] = 2;
			var _g = 0;
			var _g1 = currentBuilding.connections;
			while(_g < _g1.length) {
				var connectionList = _g1[_g];
				++_g;
				var _g2 = 0;
				while(_g2 < connectionList.length) {
					var connection = connectionList[_g2];
					++_g2;
					var newPriority = currentBuilding.priority + connection.extraPriorityIfKnown;
					var buildingTo = connection.to;
					switch(_gthis.seen[buildingTo.continuousID]) {
					case 0:
						buildingTo.inEdge = connection;
						buildingTo.previousBuilding = currentBuilding;
						var _this = buildingTo;
						_this.priority = newPriority;
						_gthis.pathQueue.enqueue(_this);
						_gthis.seen[buildingTo.continuousID] = 1;
						break;
					case 1:
						if(newPriority < buildingTo.priority) {
							buildingTo.inEdge = connection;
							buildingTo.previousBuilding = currentBuilding;
							_gthis.pathQueue.reprioritize(buildingTo,newPriority);
						}
						break;
					}
				}
			}
			if(currentBuilding.type == 2) {
				var airGroup = this.airGroups.h[currentBuilding.__id__];
				if(this.handledAirConnections[airGroup] < 5) {
					var x = this.worldX[currentBuilding.world] + currentBuilding.x;
					var y = this.worldY[currentBuilding.world] - currentBuilding.get_y();
					var _g3 = 0;
					var _g4 = this.airGroupConnections[airGroup];
					while(_g3 < _g4.length) {
						var landingSite = _g4[_g3];
						++_g3;
						var buildingTo1 = landingSite.to;
						if(buildingTo1 == currentBuilding) {
							continue;
						}
						var estimatedPriorityAdd;
						if(buildingTo1.world == currentBuilding.world) {
							var maxY = 0;
							var val1 = currentBuilding.xIndex;
							var val2 = buildingTo1.xIndex;
							var _g5 = val2 < val1 ? val2 : val1;
							var val11 = currentBuilding.xIndex;
							var val21 = buildingTo1.xIndex;
							var _g6 = 1 + (val21 > val11 ? val21 : val11);
							while(_g5 < _g6) {
								var xx = _g5++;
								var val22 = this.worldFlyingLowestTunnel[currentBuilding.world][xx];
								if(val22 > maxY) {
									maxY = val22;
								}
							}
							var val23 = buildingTo1.yIndex;
							var val24 = currentBuilding.yIndex;
							estimatedPriorityAdd = 10 + (Math.abs(buildingTo1.x - currentBuilding.x) + 20 * ((val23 > maxY ? val23 : maxY) - buildingTo1.yIndex + (val24 > maxY ? val24 : maxY) - currentBuilding.yIndex)) / 3;
						} else {
							estimatedPriorityAdd = (Math.abs(this.worldX[buildingTo1.world] + buildingTo1.x - x) + Math.abs(this.worldY[buildingTo1.world] - buildingTo1.get_y() - y)) / 1.5;
						}
						var newPriority1 = currentBuilding.priority + estimatedPriorityAdd;
						var buildingTo2 = landingSite.to;
						switch(_gthis.seen[buildingTo2.continuousID]) {
						case 0:
							buildingTo2.inEdge = landingSite;
							buildingTo2.previousBuilding = currentBuilding;
							var _this1 = buildingTo2;
							_this1.priority = newPriority1;
							_gthis.pathQueue.enqueue(_this1);
							_gthis.seen[buildingTo2.continuousID] = 1;
							break;
						case 1:
							if(newPriority1 < buildingTo2.priority) {
								buildingTo2.inEdge = landingSite;
								buildingTo2.previousBuilding = currentBuilding;
								_gthis.pathQueue.reprioritize(buildingTo2,newPriority1);
							}
							break;
						}
					}
				}
				this.handledAirConnections[airGroup]++;
			} else if(!handledTeleporterConnections) {
				var isPersonalTeleporter = currentBuilding.id == privateTeleporter;
				if(currentBuilding.isTeleporter || isPersonalTeleporter) {
					var _g7 = 0;
					var _g8 = this.teleporterConnections;
					while(_g7 < _g8.length) {
						var connection1 = _g8[_g7];
						++_g7;
						var newPriority2 = currentBuilding.priority + connection1.extraPriorityIfKnown;
						var buildingTo3 = connection1.to;
						switch(_gthis.seen[buildingTo3.continuousID]) {
						case 0:
							buildingTo3.inEdge = connection1;
							buildingTo3.previousBuilding = currentBuilding;
							var _this2 = buildingTo3;
							_this2.priority = newPriority2;
							_gthis.pathQueue.enqueue(_this2);
							_gthis.seen[buildingTo3.continuousID] = 1;
							break;
						case 1:
							if(newPriority2 < buildingTo3.priority) {
								buildingTo3.inEdge = connection1;
								buildingTo3.previousBuilding = currentBuilding;
								_gthis.pathQueue.reprioritize(buildingTo3,newPriority2);
							}
							break;
						}
					}
					if(!isPersonalTeleporter && privateTeleporter >= 0) {
						var tpBuilding = this.buildingsByID.h[privateTeleporter];
						var connection2 = new PathfindingEdge(7,tpBuilding);
						var newPriority3 = currentBuilding.priority + 10;
						switch(_gthis.seen[tpBuilding.continuousID]) {
						case 0:
							tpBuilding.inEdge = connection2;
							tpBuilding.previousBuilding = currentBuilding;
							var _this3 = tpBuilding;
							_this3.priority = newPriority3;
							_gthis.pathQueue.enqueue(_this3);
							_gthis.seen[tpBuilding.continuousID] = 1;
							break;
						case 1:
							if(newPriority3 < tpBuilding.priority) {
								tpBuilding.inEdge = connection2;
								tpBuilding.previousBuilding = currentBuilding;
								_gthis.pathQueue.reprioritize(tpBuilding,newPriority3);
							}
							break;
						}
					}
					handledTeleporterConnections = true;
				}
			}
			if(currentBuilding.isBottomBuilding && (currentBuilding.inEdge == null || currentBuilding.inEdge.type != 5)) {
				var _g9 = 0;
				var _g10 = this.bottomBuildingsOfWorlds[currentBuilding.world];
				while(_g9 < _g10.length) {
					var connection3 = _g10[_g9];
					++_g9;
					var building = connection3.to;
					var val = building.x - currentBuilding.x;
					var newPriority4 = currentBuilding.priority + (val < 0 ? -val : val);
					switch(_gthis.seen[building.continuousID]) {
					case 0:
						building.inEdge = connection3;
						building.previousBuilding = currentBuilding;
						var _this4 = building;
						_this4.priority = newPriority4;
						_gthis.pathQueue.enqueue(_this4);
						_gthis.seen[building.continuousID] = 1;
						break;
					case 1:
						if(newPriority4 < building.priority) {
							building.inEdge = connection3;
							building.previousBuilding = currentBuilding;
							_gthis.pathQueue.reprioritize(building,newPriority4);
						}
						break;
					}
				}
			}
		}
		this.generateNewPathsArrayIfNeeded(1,pathsLeft);
		this.finalPaths[0] += 1;
		this.finalPaths[this.finalPathsPos++] = 1;
		this.finalPaths[this.finalPathsPos++] = -1;
	}
	,generateNewPathsArrayIfNeeded: function(pathLength,pathsLeft) {
		if(this.finalPaths != null && this.finalPathsPos + pathLength + 1 > this.finalPaths.length) {
			this.sendPathsMessage();
		}
		if(this.finalPaths == null) {
			var val2 = (pathLength + 2) * pathsLeft + 1;
			this.finalPaths = new Int32Array(val2 > 21 ? val2 : 21);
		}
	}
	,sendPathsMessage: function() {
		if(this.finalPathsPos > 1) {
			this.thread.postInt32Array(this.finalPaths);
			this.finalPaths = null;
			this.finalPathsPos = 1;
		}
	}
	,handleGetFullWorldInfo: function(data) {
		var continuousBuildingID = 0;
		var i = 2;
		this.teleporterConnections = [];
		this.buildingsByID = new haxe_ds_IntMap();
		this.worlds = [];
		this.worldX = [];
		this.worldY = [];
		this.bottomBuildingsOfWorlds = [];
		this.worldFlyingLowestTunnel = [];
		var numberOfWorlds = data[1];
		var _g = 0;
		var _g1 = numberOfWorlds;
		while(_g < _g1) {
			var w = _g++;
			var numberOfBuildingArrays = data[i++];
			this.worldX.push(data[i++]);
			this.worldY.push(data[i++]);
			var buildingArray = [];
			this.worlds.push(buildingArray);
			var flyingTunnelArray = [];
			this.worldFlyingLowestTunnel.push(flyingTunnelArray);
			var worldBottomBuildings = [];
			this.bottomBuildingsOfWorlds.push(worldBottomBuildings);
			var _g2 = 0;
			var _g3 = numberOfBuildingArrays;
			while(_g2 < _g3) {
				var b = _g2++;
				var buildings = [];
				buildingArray.push(buildings);
				var buildingNumber = data[i++];
				var previousElevatorBuilding = null;
				var distanceToPreviousElevatorBuilding = 0;
				var lowestTunnel = buildingNumber;
				var _g4 = 0;
				var _g5 = buildingNumber;
				while(_g4 < _g5) {
					var bl = _g4++;
					var buildingID = data[i++];
					if(buildingID != -1) {
						++distanceToPreviousElevatorBuilding;
						var buildingType = data[i++];
						var isRooftopBuilding = buildingType % 2 == 1;
						buildingType >>= 1;
						var thisBuilding = new PathfindingBuilding(buildingID,continuousBuildingID++,buildingType,b * 20,w,bl,isRooftopBuilding);
						if(bl == 0) {
							thisBuilding.isBottomBuilding = true;
							worldBottomBuildings.push(new PathfindingEdge(5,thisBuilding));
						}
						if(buildingType == 1) {
							thisBuilding.isTeleporter = true;
							this.teleporterConnections.push(new PathfindingEdge(7,thisBuilding,10));
						}
						if(buildingType == 3) {
							thisBuilding.isNonBuildingPermanent = true;
						}
						if(buildingType == 4) {
							if(previousElevatorBuilding != null) {
								previousElevatorBuilding.connections.push([new PathfindingEdge(13,thisBuilding,distanceToPreviousElevatorBuilding)]);
								thisBuilding.connections.push([new PathfindingEdge(13,previousElevatorBuilding,distanceToPreviousElevatorBuilding)]);
							}
							previousElevatorBuilding = thisBuilding;
							distanceToPreviousElevatorBuilding = 0;
						}
						if(buildingType == 5 || buildingType == 2) {
							if(bl < lowestTunnel) {
								lowestTunnel = bl;
							}
						}
						buildings.push(thisBuilding);
						this.buildingsByID.h[buildingID] = thisBuilding;
					} else {
						buildings.push(null);
						previousElevatorBuilding = null;
						if(bl < lowestTunnel) {
							lowestTunnel = bl;
						}
						++i;
					}
				}
				flyingTunnelArray.push(lowestTunnel);
			}
			var _g6 = 0;
			var _g7 = numberOfBuildingArrays;
			while(_g6 < _g7) {
				var x = _g6++;
				var _g8 = 0;
				var _g9 = buildingArray[x].length;
				while(_g8 < _g9) {
					var y = _g8++;
					var walkThroughEdges = [];
					var thisBuilding1 = buildingArray[x][y];
					if(thisBuilding1 == null) {
						continue;
					}
					if(thisBuilding1.isNonBuildingPermanent) {
						continue;
					}
					var thisIsRooftopBuilding = buildingArray[x][y].isRooftopBuilding;
					if(x > 0 && y > 0 && buildingArray[x - 1].length > y && !thisIsRooftopBuilding && buildingArray[x - 1][y] != null && !buildingArray[x - 1][y].isRooftopBuilding) {
						walkThroughEdges.push(new PathfindingEdge(2,buildingArray[x - 1][y]));
					}
					if(x < numberOfBuildingArrays - 1 && y > 0 && buildingArray[x + 1].length > y && !thisIsRooftopBuilding && buildingArray[x + 1][y] != null && !buildingArray[x + 1][y].isRooftopBuilding) {
						walkThroughEdges.push(new PathfindingEdge(3,buildingArray[x + 1][y]));
					}
					if(y < buildingArray[x].length - 1 && buildingArray[x][y + 1] != null && !buildingArray[x][y].isRooftopBuilding) {
						walkThroughEdges.push(new PathfindingEdge(0,buildingArray[x][y + 1]));
					}
					if(y > 0 && buildingArray[x][y - 1] != null && !buildingArray[x][y - 1].isNonBuildingPermanent && !buildingArray[x][y - 1].isRooftopBuilding) {
						walkThroughEdges.push(new PathfindingEdge(1,buildingArray[x][y - 1]));
					}
					thisBuilding1.connections.push(walkThroughEdges);
				}
			}
		}
		var extraConnectionNum = data[i++];
		var _g = 0;
		var _g1 = extraConnectionNum;
		while(_g < _g1) {
			var j = _g++;
			var connectionType = data[i++];
			var thisBuilding = this.buildingsByID.h[data[i++]];
			var otherBuilding = this.buildingsByID.h[data[i++]];
			this.worlds[thisBuilding.world][thisBuilding.x / 20 | 0][thisBuilding.yIndex].connections.push([new PathfindingEdge(connectionType,otherBuilding)]);
		}
		var airConnectionGroupsNumber = data[i++];
		this.airGroupLength = 0;
		this.airGroupConnections = [];
		this.airGroups = new haxe_ds_ObjectMap();
		var _g = 0;
		var _g1 = airConnectionGroupsNumber;
		while(_g < _g1) {
			var j = _g++;
			var groupSize = data[i++];
			var thisAirGroupConnections = [];
			var _g2 = 0;
			var _g3 = groupSize;
			while(_g2 < _g3) {
				var k = _g2++;
				var thisBuilding = this.buildingsByID.h[data[i++]];
				this.airGroups.set(thisBuilding,j);
				thisAirGroupConnections.push(new PathfindingEdge(11,thisBuilding));
			}
			this.airGroupConnections.push(thisAirGroupConnections);
			this.airGroupLength += 1;
		}
		this.amountOfBuildings = continuousBuildingID;
	}
};
var PathfinderThread = function() {
	this.useModernPostMessage = false;
	PathfinderThread.__internal__self = this;
	this.pathfinder = new Pathfinder(this);
	this.useModernPostMessage = false;
};
PathfinderThread.main = function() {
	new PathfinderThread();
};
PathfinderThread.prototype = {
	onMessage: function(e) {
		var data = new Int32Array(e.data);
		if(data[0] == 2) {
			this.useModernPostMessage = true;
			return;
		}
		this.pathfinder.handleMessage(data);
	}
	,postInt32Array: function(arrayToPost) {
		if(this.useModernPostMessage) {
			postMessage(arrayToPost.buffer, [arrayToPost.buffer]);
		} else {
			postMessage(arrayToPost.buffer);
		}
	}
	,__internal__onMessage: function(e) {
		PathfinderThread.__internal__self.onMessage(e);
	}
};
var PathfindingBuilding = function(id,continuousID,type,x,world,yIndex,isRooftopBuilding) {
	this.connections = [];
	this.id = id;
	this.continuousID = continuousID;
	this.type = type;
	this.x = x;
	this.xIndex = x / 20 | 0;
	this.world = world;
	this.yIndex = yIndex;
	this.isRooftopBuilding = isRooftopBuilding;
};
PathfindingBuilding.prototype = {
	get_y: function() {
		return this.yIndex * 20;
	}
};
var PathfindingEdge = function(type,to,extraPriority) {
	if(extraPriority == null) {
		extraPriority = 20;
	}
	this.type = type;
	this.to = to;
	this.extraPriorityIfKnown = extraPriority;
};
var haxe_Exception = function(message,previous,native) {
	Error.call(this,message);
	this.message = message;
	this.__previousException = previous;
	this.__nativeException = native != null ? native : this;
};
haxe_Exception.thrown = function(value) {
	if(((value) instanceof haxe_Exception)) {
		return value.get_native();
	} else if(((value) instanceof Error)) {
		return value;
	} else {
		var e = new haxe_ValueException(value);
		return e;
	}
};
haxe_Exception.__super__ = Error;
haxe_Exception.prototype = $extend(Error.prototype,{
	get_native: function() {
		return this.__nativeException;
	}
});
var haxe_ValueException = function(value,previous,native) {
	haxe_Exception.call(this,String(value),previous,native);
	this.value = value;
};
haxe_ValueException.__super__ = haxe_Exception;
haxe_ValueException.prototype = $extend(haxe_Exception.prototype,{
});
var haxe_ds_IntMap = function() {
	this.h = { };
};
var haxe_ds_ObjectMap = function() {
	this.h = { __keys__ : { }};
};
haxe_ds_ObjectMap.prototype = {
	set: function(key,value) {
		var id = key.__id__;
		if(id == null) {
			id = (key.__id__ = $global.$haxeUID++);
		}
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
};
var haxe_iterators_ArrayIterator = function(array) {
	this.current = 0;
	this.array = array;
};
haxe_iterators_ArrayIterator.prototype = {
	hasNext: function() {
		return this.current < this.array.length;
	}
	,next: function() {
		return this.array[this.current++];
	}
};
var polygonal_ds_PriorityQueue = function(initalCapacity,inverse,source) {
	if(inverse == null) {
		inverse = false;
	}
	if(initalCapacity == null) {
		initalCapacity = 1;
	}
	this.mSize = 0;
	this.growthRate = -2;
	this.mInitialCapacity = 1 > initalCapacity ? 1 : initalCapacity;
	this.capacity = initalCapacity;
	this.mInverse = inverse;
	if(source != null) {
		this.mSize = source.length;
		var x = this.mSize;
		var y = this.capacity;
		this.capacity = x > y ? x : y;
	}
	this.mData = new Array(this.capacity + 1);
	this.mData[0] = null;
	if(source != null) {
		var d = this.mData;
		var _g = 1;
		var _g1 = this.mSize + 1;
		while(_g < _g1) {
			var i = _g++;
			d[i] = source[i - 1];
		}
		this.repair();
	}
};
polygonal_ds_PriorityQueue.prototype = {
	enqueue: function(val) {
		if(this.mSize == this.capacity) {
			this.grow();
		}
		this.mData[++this.mSize] = val;
		val.position = this.mSize;
		var index = this.mSize;
		var d = this.mData;
		var parent = index >> 1;
		var t = d[index];
		var p = t.priority;
		if(this.mInverse) {
			while(parent > 0) {
				var parentVal = d[parent];
				if(p - parentVal.priority < 0) {
					d[index] = parentVal;
					parentVal.position = index;
					index = parent;
					parent >>= 1;
				} else {
					break;
				}
			}
		} else {
			while(parent > 0) {
				var parentVal = d[parent];
				if(p - parentVal.priority > 0) {
					d[index] = parentVal;
					parentVal.position = index;
					index = parent;
					parent >>= 1;
				} else {
					break;
				}
			}
		}
		d[index] = t;
		t.position = index;
	}
	,dequeue: function() {
		var d = this.mData;
		var x = d[1];
		x.position = -1;
		d[1] = d[this.mSize];
		var index = 1;
		var d = this.mData;
		var child = index << 1;
		var childVal;
		var t = d[index];
		var p = t.priority;
		if(this.mInverse) {
			while(child < this.mSize) {
				if(child < this.mSize - 1) {
					if(d[child].priority - d[child + 1].priority > 0) {
						++child;
					}
				}
				childVal = d[child];
				if(p - childVal.priority > 0) {
					d[index] = childVal;
					childVal.position = index;
					t.position = child;
					index = child;
					child <<= 1;
				} else {
					break;
				}
			}
		} else {
			while(child < this.mSize) {
				if(child < this.mSize - 1) {
					if(d[child].priority - d[child + 1].priority < 0) {
						++child;
					}
				}
				childVal = d[child];
				if(p - childVal.priority < 0) {
					d[index] = childVal;
					childVal.position = index;
					t.position = child;
					index = child;
					child <<= 1;
				} else {
					break;
				}
			}
		}
		d[index] = t;
		t.position = index;
		this.mSize--;
		return x;
	}
	,reprioritize: function(val,priority) {
		var oldPriority = val.priority;
		if(oldPriority == priority) {
			return this;
		}
		val.priority = priority;
		var pos = val.position;
		if(this.mInverse) {
			if(priority < oldPriority) {
				var index = pos;
				var d = this.mData;
				var parent = index >> 1;
				var t = d[index];
				var p = t.priority;
				if(this.mInverse) {
					while(parent > 0) {
						var parentVal = d[parent];
						if(p - parentVal.priority < 0) {
							d[index] = parentVal;
							parentVal.position = index;
							index = parent;
							parent >>= 1;
						} else {
							break;
						}
					}
				} else {
					while(parent > 0) {
						var parentVal = d[parent];
						if(p - parentVal.priority > 0) {
							d[index] = parentVal;
							parentVal.position = index;
							index = parent;
							parent >>= 1;
						} else {
							break;
						}
					}
				}
				d[index] = t;
				t.position = index;
			} else {
				var index = pos;
				var d = this.mData;
				var child = index << 1;
				var childVal;
				var t = d[index];
				var p = t.priority;
				if(this.mInverse) {
					while(child < this.mSize) {
						if(child < this.mSize - 1) {
							if(d[child].priority - d[child + 1].priority > 0) {
								++child;
							}
						}
						childVal = d[child];
						if(p - childVal.priority > 0) {
							d[index] = childVal;
							childVal.position = index;
							t.position = child;
							index = child;
							child <<= 1;
						} else {
							break;
						}
					}
				} else {
					while(child < this.mSize) {
						if(child < this.mSize - 1) {
							if(d[child].priority - d[child + 1].priority < 0) {
								++child;
							}
						}
						childVal = d[child];
						if(p - childVal.priority < 0) {
							d[index] = childVal;
							childVal.position = index;
							t.position = child;
							index = child;
							child <<= 1;
						} else {
							break;
						}
					}
				}
				d[index] = t;
				t.position = index;
				var index = this.mSize;
				var d = this.mData;
				var parent = index >> 1;
				var t = d[index];
				var p = t.priority;
				if(this.mInverse) {
					while(parent > 0) {
						var parentVal = d[parent];
						if(p - parentVal.priority < 0) {
							d[index] = parentVal;
							parentVal.position = index;
							index = parent;
							parent >>= 1;
						} else {
							break;
						}
					}
				} else {
					while(parent > 0) {
						var parentVal = d[parent];
						if(p - parentVal.priority > 0) {
							d[index] = parentVal;
							parentVal.position = index;
							index = parent;
							parent >>= 1;
						} else {
							break;
						}
					}
				}
				d[index] = t;
				t.position = index;
			}
		} else if(priority > oldPriority) {
			var index = pos;
			var d = this.mData;
			var parent = index >> 1;
			var t = d[index];
			var p = t.priority;
			if(this.mInverse) {
				while(parent > 0) {
					var parentVal = d[parent];
					if(p - parentVal.priority < 0) {
						d[index] = parentVal;
						parentVal.position = index;
						index = parent;
						parent >>= 1;
					} else {
						break;
					}
				}
			} else {
				while(parent > 0) {
					var parentVal = d[parent];
					if(p - parentVal.priority > 0) {
						d[index] = parentVal;
						parentVal.position = index;
						index = parent;
						parent >>= 1;
					} else {
						break;
					}
				}
			}
			d[index] = t;
			t.position = index;
		} else {
			var index = pos;
			var d = this.mData;
			var child = index << 1;
			var childVal;
			var t = d[index];
			var p = t.priority;
			if(this.mInverse) {
				while(child < this.mSize) {
					if(child < this.mSize - 1) {
						if(d[child].priority - d[child + 1].priority > 0) {
							++child;
						}
					}
					childVal = d[child];
					if(p - childVal.priority > 0) {
						d[index] = childVal;
						childVal.position = index;
						t.position = child;
						index = child;
						child <<= 1;
					} else {
						break;
					}
				}
			} else {
				while(child < this.mSize) {
					if(child < this.mSize - 1) {
						if(d[child].priority - d[child + 1].priority < 0) {
							++child;
						}
					}
					childVal = d[child];
					if(p - childVal.priority < 0) {
						d[index] = childVal;
						childVal.position = index;
						t.position = child;
						index = child;
						child <<= 1;
					} else {
						break;
					}
				}
			}
			d[index] = t;
			t.position = index;
			var index = this.mSize;
			var d = this.mData;
			var parent = index >> 1;
			var t = d[index];
			var p = t.priority;
			if(this.mInverse) {
				while(parent > 0) {
					var parentVal = d[parent];
					if(p - parentVal.priority < 0) {
						d[index] = parentVal;
						parentVal.position = index;
						index = parent;
						parent >>= 1;
					} else {
						break;
					}
				}
			} else {
				while(parent > 0) {
					var parentVal = d[parent];
					if(p - parentVal.priority > 0) {
						d[index] = parentVal;
						parentVal.position = index;
						index = parent;
						parent >>= 1;
					} else {
						break;
					}
				}
			}
			d[index] = t;
			t.position = index;
		}
		return this;
	}
	,clear: function(gc) {
		if(gc == null) {
			gc = false;
		}
		if(gc) {
			polygonal_ds_tools_NativeArrayTools.nullify(this.mData);
		}
		this.mSize = 0;
	}
	,repair: function() {
		var i = this.mSize >> 1;
		while(i >= 1) {
			this.heapify(i,this.mSize);
			--i;
		}
	}
	,heapify: function(p,s) {
		var d = this.mData;
		var l = p << 1;
		var r = l + 1;
		var max = p;
		if(this.mInverse) {
			if(l <= s && d[l].priority - d[max].priority < 0) {
				max = l;
			}
			if(l + 1 <= s && d[l + 1].priority - d[max].priority < 0) {
				max = r;
			}
		} else {
			if(l <= s && d[l].priority - d[max].priority > 0) {
				max = l;
			}
			if(l + 1 <= s && d[l + 1].priority - d[max].priority > 0) {
				max = r;
			}
		}
		var a;
		var b;
		var t;
		if(max != p) {
			a = d[max];
			b = d[p];
			d[max] = b;
			d[p] = a;
			t = a.position;
			a.position = b.position;
			b.position = t;
			this.heapify(max,s);
		}
	}
	,grow: function() {
		this.capacity = polygonal_ds_tools_GrowthRate.compute(this.growthRate,this.capacity);
		this.resizeContainer(this.capacity);
	}
	,resizeContainer: function(newSize) {
		var t = new Array(newSize + 1);
		polygonal_ds_tools_NativeArrayTools.blit(this.mData,0,t,0,this.mSize + 1);
		this.mData = t;
	}
};
var polygonal_ds_tools_GrowthRate = function() { };
polygonal_ds_tools_GrowthRate.compute = function(rate,capacity) {
	if(rate > 0) {
		capacity += rate;
	} else {
		switch(rate) {
		case -3:
			capacity <<= 1;
			break;
		case -2:
			capacity = (capacity * 3 >> 1) + 1;
			break;
		case -1:
			var newSize = capacity + 1;
			capacity = (newSize >> 3) + (newSize < 9 ? 3 : 6);
			capacity += newSize;
			break;
		case 0:
			throw haxe_Exception.thrown("out of space");
		}
	}
	return capacity;
};
var polygonal_ds_tools_NativeArrayTools = function() { };
polygonal_ds_tools_NativeArrayTools.blit = function(src,srcPos,dst,dstPos,n) {
	if(n > 0) {
		if(src == dst) {
			if(srcPos < dstPos) {
				var i = srcPos + n;
				var j = dstPos + n;
				var _g = 0;
				var _g1 = n;
				while(_g < _g1) {
					var k = _g++;
					--i;
					--j;
					src[j] = src[i];
				}
			} else if(srcPos > dstPos) {
				var i = srcPos;
				var j = dstPos;
				var _g = 0;
				var _g1 = n;
				while(_g < _g1) {
					var k = _g++;
					src[j] = src[i];
					++i;
					++j;
				}
			}
		} else if(srcPos == 0 && dstPos == 0) {
			var _g = 0;
			var _g1 = n;
			while(_g < _g1) {
				var i = _g++;
				dst[i] = src[i];
			}
		} else if(srcPos == 0) {
			var _g = 0;
			var _g1 = n;
			while(_g < _g1) {
				var i = _g++;
				dst[dstPos + i] = src[i];
			}
		} else if(dstPos == 0) {
			var _g = 0;
			var _g1 = n;
			while(_g < _g1) {
				var i = _g++;
				dst[i] = src[srcPos + i];
			}
		} else {
			var _g = 0;
			var _g1 = n;
			while(_g < _g1) {
				var i = _g++;
				dst[dstPos + i] = src[srcPos + i];
			}
		}
	}
};
polygonal_ds_tools_NativeArrayTools.nullify = function(a,first,n) {
	if(n == null) {
		n = 0;
	}
	if(first == null) {
		first = 0;
	}
	var min = first;
	var max = n <= 0 ? a.length : min + n;
	while(min < max) a[min++] = null;
	return a;
};
$global.$haxeUID |= 0;
onmessage = PathfinderThread.prototype.__internal__onMessage;
haxe_ds_ObjectMap.count = 0;
PathfinderThread.main();
})(typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this);
